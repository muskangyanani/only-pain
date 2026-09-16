import type { RiskLevel, ReportReason } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { classifyContent } from "../ai/safety.js";
import { notify } from "./notification.service.js";
import { badRequest, notFound } from "../lib/errors.js";
import { cursorArgs, paginate } from "../lib/pagination.js";
import { authorSelect } from "../lib/selects.js";
import type { CrisisLevel } from "../lib/crisis.js";

const SUPPORT_MESSAGE =
  "It sounds like you're carrying something really heavy right now. You matter, and you don't have to hold it alone — here are people you can reach, any hour.";

async function sendSupportOnce(userId: string) {
  // At most one gentle support nudge per 24h so it never feels like surveillance.
  const recent = await prisma.notification.findFirst({
    where: { userId, type: "SUPPORT", createdAt: { gte: new Date(Date.now() - 86400000) } },
    select: { id: true },
  });
  if (recent) return;
  await notify({ userId, type: "SUPPORT", message: SUPPORT_MESSAGE });
}

/** Background AI safety pass for a post. Never blocks the request path. */
export async function moderatePost(postId: string, content: string, authorId: string, prescreen: CrisisLevel) {
  try {
    const result = await classifyContent(content, "post", prescreen);
    await prisma.post.update({
      where: { id: postId },
      data: {
        riskLevel: result.risk,
        aiReviewedAt: new Date(),
        ...(result.harmful ? { moderation: "HIDDEN" } : {}),
        ...(result.contentWarning ? { contentWarning: result.contentWarning } : {}),
      },
    });
    if (result.harmful || result.risk === "HIGH" || result.risk === "MEDIUM") {
      await prisma.report.create({
        data: {
          source: "AI",
          postId,
          targetUserId: authorId,
          reason: result.harmful ? "HARMFUL_CONTENT" : "SELF_HARM_RISK",
          details: result.rationale,
          riskLevel: result.risk,
        },
      });
    }
    if (result.risk === "HIGH") await sendSupportOnce(authorId);
  } catch (err) {
    logger.warn({ err, postId }, "moderatePost failed");
  }
}

export async function moderateComment(commentId: string, content: string, authorId: string, prescreen: CrisisLevel) {
  try {
    const result = await classifyContent(content, "comment", prescreen);
    await prisma.comment.update({
      where: { id: commentId },
      data: { riskLevel: result.risk, ...(result.harmful ? { moderation: "HIDDEN" } : {}) },
    });
    if (result.harmful || result.risk === "HIGH") {
      await prisma.report.create({
        data: {
          source: "AI",
          commentId,
          targetUserId: authorId,
          reason: result.harmful ? "HARMFUL_CONTENT" : "SELF_HARM_RISK",
          details: result.rationale,
          riskLevel: result.risk,
        },
      });
    }
    if (result.risk === "HIGH") await sendSupportOnce(authorId);
  } catch (err) {
    logger.warn({ err, commentId }, "moderateComment failed");
  }
}

/** DMs are private: we never hide them, but a HIGH-risk message triggers a support nudge to the sender. */
export async function moderateMessage(messageId: string, content: string, senderId: string, prescreen: CrisisLevel) {
  try {
    if (prescreen === "NONE") return;
    const result = await classifyContent(content, "message", prescreen);
    await prisma.message.update({ where: { id: messageId }, data: { riskLevel: result.risk } });
    if (result.risk === "HIGH") await sendSupportOnce(senderId);
  } catch (err) {
    logger.warn({ err, messageId }, "moderateMessage failed");
  }
}

// ---------- User reports ----------

export async function createReport(
  reporterId: string,
  input: { postId?: string | null; commentId?: string | null; userId?: string | null; reason: ReportReason; details?: string | null }
) {
  if (!input.postId && !input.commentId && !input.userId) throw badRequest("Nothing to report.");
  let targetUserId = input.userId ?? null;
  if (input.postId) {
    const post = await prisma.post.findUnique({ where: { id: input.postId }, select: { authorId: true } });
    if (!post) throw notFound("Post");
    targetUserId = post.authorId;
  } else if (input.commentId) {
    const comment = await prisma.comment.findUnique({ where: { id: input.commentId }, select: { authorId: true } });
    if (!comment) throw notFound("Comment");
    targetUserId = comment.authorId;
  }
  const dup = await prisma.report.findFirst({
    where: {
      reporterId,
      status: "OPEN",
      ...(input.postId ? { postId: input.postId } : input.commentId ? { commentId: input.commentId } : { targetUserId, postId: null, commentId: null }),
    },
  });
  if (dup) return dup;
  return prisma.report.create({
    data: {
      source: "USER",
      reporterId,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      targetUserId,
      reason: input.reason,
      details: input.details ?? null,
    },
  });
}

// ---------- Moderator queue ----------

const reportInclude = {
  reporter: { select: authorSelect },
  targetUser: { select: { ...authorSelect, isBanned: true } },
  post: { select: { id: true, content: true, isAnonymous: true, moderation: true, riskLevel: true, contentWarning: true, createdAt: true } },
  comment: { select: { id: true, content: true, isAnonymous: true, moderation: true, riskLevel: true, postId: true, createdAt: true } },
  resolvedBy: { select: authorSelect },
} as const;

export async function queue(status: "OPEN" | "RESOLVED" | "DISMISSED", cursor: string | undefined, limit: number) {
  const rows = await prisma.report.findMany({
    where: { status },
    ...cursorArgs(cursor, limit),
    orderBy: [{ riskLevel: "desc" }, { createdAt: "desc" }],
    include: reportInclude,
  });
  return paginate(rows, limit);
}

export async function stats() {
  const [open, hidden, highRisk24h, users, posts] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.post.count({ where: { moderation: "HIDDEN" } }),
    prisma.report.count({ where: { riskLevel: "HIGH", createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    prisma.user.count(),
    prisma.post.count(),
  ]);
  return { open, hidden, highRisk24h, users, posts };
}

export type ModAction = "dismiss" | "hide" | "restore" | "remove" | "ban" | "unban";

export async function resolve(reportId: string, modId: string, action: ModAction, note?: string | null) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw notFound("Report");
  const ops: Promise<unknown>[] = [];
  if (report.postId && (action === "hide" || action === "remove" || action === "restore")) {
    const moderation = action === "hide" ? "HIDDEN" : action === "remove" ? "REMOVED" : "VISIBLE";
    ops.push(prisma.post.update({ where: { id: report.postId }, data: { moderation } }));
  }
  if (report.commentId && (action === "hide" || action === "remove" || action === "restore")) {
    const moderation = action === "hide" ? "HIDDEN" : action === "remove" ? "REMOVED" : "VISIBLE";
    ops.push(prisma.comment.update({ where: { id: report.commentId }, data: { moderation } }));
  }
  if (report.targetUserId && (action === "ban" || action === "unban")) {
    ops.push(
      prisma.user.update({
        where: { id: report.targetUserId },
        data: { isBanned: action === "ban", bannedReason: action === "ban" ? note ?? "Community guidelines" : null },
      })
    );
    if (action === "ban") ops.push(prisma.refreshSession.deleteMany({ where: { userId: report.targetUserId } }));
  }
  await Promise.all(ops);
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status: action === "dismiss" ? "DISMISSED" : "RESOLVED",
      resolvedById: modId,
      resolvedAt: new Date(),
      resolution: `${action}${note ? `: ${note}` : ""}`,
    },
    include: reportInclude,
  });
}

export function riskFromLevel(level: CrisisLevel): RiskLevel {
  return level === "NONE" ? "NONE" : level;
}
