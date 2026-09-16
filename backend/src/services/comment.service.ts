import { prisma } from "../lib/prisma.js";
import { stripAnonymous } from "../lib/anonymize.js";
import { cursorArgs, paginate } from "../lib/pagination.js";
import { forbidden, notFound } from "../lib/errors.js";
import { scanCrisis } from "../lib/crisis.js";
import { notify } from "./notification.service.js";
import { authorSelect } from "../lib/selects.js";
import { moderateComment } from "./moderation.service.js";

const include = { author: { select: authorSelect } } as const;

export async function createComment(
  postId: string,
  authorId: string,
  input: { content: string; isAnonymous: boolean; parentCommentId?: string | null }
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, moderation: true, isAnonymous: true },
  });
  if (!post || post.moderation === "REMOVED") throw notFound("Post");

  // Two-level threads only: replying to a reply attaches to the top-level parent.
  let parentId = input.parentCommentId ?? null;
  let parentAuthorId: string | null = null;
  let parentAnonymous = false;
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { postId: true, parentCommentId: true, authorId: true, isAnonymous: true },
    });
    if (!parent || parent.postId !== postId) throw notFound("Comment");
    parentAuthorId = parent.authorId;
    parentAnonymous = parent.isAnonymous;
    if (parent.parentCommentId) parentId = parent.parentCommentId;
  }

  const crisis = scanCrisis(input.content);
  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId,
      content: input.content,
      isAnonymous: input.isAnonymous,
      parentCommentId: parentId,
      riskLevel: crisis.level === "HIGH" ? "HIGH" : crisis.level === "MEDIUM" ? "MEDIUM" : "NONE",
    },
    include,
  });
  await prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });

  const notified = new Set<string>([authorId]);
  if (parentAuthorId && !notified.has(parentAuthorId)) {
    notified.add(parentAuthorId);
    void notify({
      userId: parentAuthorId,
      type: "REPLY",
      actorId: authorId,
      actorAnonymous: input.isAnonymous,
      postId,
      commentId: comment.id,
    });
    void parentAnonymous;
  }
  if (!notified.has(post.authorId)) {
    void notify({
      userId: post.authorId,
      type: "COMMENT",
      actorId: authorId,
      actorAnonymous: input.isAnonymous,
      postId,
      commentId: comment.id,
    });
  }
  void moderateComment(comment.id, comment.content, authorId, crisis.level);

  return {
    comment: { ...stripAnonymous({ ...comment, isMine: true }, authorId), replies: [] },
    safety: { showResources: crisis.level !== "NONE", level: crisis.level },
  };
}

export async function listComments(postId: string, viewerId: string | null, cursor: string | undefined, limit: number) {
  const rows = await prisma.comment.findMany({
    where: { postId, parentCommentId: null, moderation: { in: ["VISIBLE", "PENDING"] } },
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "asc" },
    include,
  });
  const page = paginate(rows, limit);
  const parentIds = page.data.map((c) => c.id);
  const replies = parentIds.length
    ? await prisma.comment.findMany({
        where: { parentCommentId: { in: parentIds }, moderation: { in: ["VISIBLE", "PENDING"] } },
        orderBy: { createdAt: "asc" },
        include,
      })
    : [];
  const byParent = new Map<string, typeof replies>();
  for (const r of replies) {
    const list = byParent.get(r.parentCommentId!) ?? [];
    list.push(r);
    byParent.set(r.parentCommentId!, list);
  }
  const decorate = (c: (typeof rows)[number]) =>
    stripAnonymous({ ...c, isMine: !!viewerId && c.authorId === viewerId }, viewerId);

  return {
    ...page,
    data: page.data.map((c) => ({ ...decorate(c), replies: (byParent.get(c.id) ?? []).map(decorate) })),
  };
}

export async function deleteComment(commentId: string, user: { id: string; role: string }) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true, parentCommentId: true },
  });
  if (!comment) throw notFound("Comment");
  if (comment.authorId !== user.id && user.role === "USER") throw forbidden();
  const childCount = comment.parentCommentId ? 0 : await prisma.comment.count({ where: { parentCommentId: commentId } });
  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { parentCommentId: commentId } }),
    prisma.comment.delete({ where: { id: commentId } }),
    prisma.post.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 + childCount } } }),
  ]);
}
