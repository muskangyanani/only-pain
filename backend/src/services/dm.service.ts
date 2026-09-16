import { prisma } from "../lib/prisma.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { cursorArgs, paginate } from "../lib/pagination.js";
import { scanCrisis } from "../lib/crisis.js";
import { emitToUser } from "../socket/emitter.js";
import { notify } from "./notification.service.js";
import { authorSelect } from "../lib/selects.js";
import { canMessage } from "./user.service.js";
import { moderateMessage } from "./moderation.service.js";

const participantSelect = { ...authorSelect, lastActiveAt: true } as const;

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function shape(convo: {
  id: string;
  userAId: string;
  userBId: string;
  initiatorId: string;
  status: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  unreadA: number;
  unreadB: number;
  createdAt: Date;
  userA: { id: string; username: string; displayName: string | null; avatarUrl: string | null; lastActiveAt: Date };
  userB: { id: string; username: string; displayName: string | null; avatarUrl: string | null; lastActiveAt: Date };
}, viewerId: string) {
  const isA = convo.userAId === viewerId;
  return {
    id: convo.id,
    status: convo.status,
    other: isA ? convo.userB : convo.userA,
    isInitiator: convo.initiatorId === viewerId,
    unread: isA ? convo.unreadA : convo.unreadB,
    lastMessageAt: convo.lastMessageAt,
    lastMessagePreview: convo.lastMessagePreview,
    createdAt: convo.createdAt,
  };
}

const include = { userA: { select: participantSelect }, userB: { select: participantSelect } } as const;

export async function startConversation(initiatorId: string, targetUserId: string, content: string) {
  if (initiatorId === targetUserId) throw badRequest("You can't message yourself.");
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, dmPrivacy: true, isBanned: true } });
  if (!target || target.isBanned) throw notFound("User");
  const [a, b] = pair(initiatorId, targetUserId);
  const existing = await prisma.conversation.findUnique({ where: { userAId_userBId: { userAId: a, userBId: b } }, include });
  if (existing) {
    if (existing.status === "DECLINED" && existing.initiatorId === initiatorId) {
      throw forbidden("This person isn't accepting messages from you right now.", "DECLINED");
    }
    if (existing.status === "PENDING" && existing.initiatorId === initiatorId) {
      throw forbidden("Your request is still waiting for a reply.", "REQUEST_PENDING");
    }
    const message = await sendMessage(initiatorId, existing.id, content);
    return { conversation: shape(existing, initiatorId), message, created: false };
  }
  if (!(await canMessage(initiatorId, target))) {
    throw forbidden("This person isn't accepting message requests right now.", "DM_NOT_ALLOWED");
  }
  const crisis = scanCrisis(content);
  const convo = await prisma.conversation.create({
    data: {
      userAId: a,
      userBId: b,
      initiatorId,
      status: "PENDING",
      lastMessageAt: new Date(),
      lastMessagePreview: content.slice(0, 80),
      unreadA: a === initiatorId ? 0 : 1,
      unreadB: b === initiatorId ? 0 : 1,
      messages: { create: { senderId: initiatorId, content, riskLevel: crisis.level === "NONE" ? "NONE" : crisis.level } },
    },
    include: { ...include, messages: { include: { sender: { select: authorSelect } } } },
  });
  const message = convo.messages[0]!;
  void notify({ userId: targetUserId, type: "DM_REQUEST", actorId: initiatorId, conversationId: convo.id });
  void moderateMessage(message.id, content, initiatorId, crisis.level);
  return { conversation: shape(convo, initiatorId), message, created: true };
}

export async function listConversations(userId: string, filter: "inbox" | "requests") {
  const rows = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      ...(filter === "requests"
        ? { status: "PENDING", NOT: { initiatorId: userId } }
        : { OR: [{ status: "ACCEPTED" }, { status: "PENDING", initiatorId: userId }] }),
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include,
  });
  return rows.map((r) => shape(r, userId));
}

export async function getConversation(userId: string, id: string) {
  const convo = await prisma.conversation.findUnique({ where: { id }, include });
  if (!convo || (convo.userAId !== userId && convo.userBId !== userId)) throw notFound("Conversation");
  return shape(convo, userId);
}

export async function respondToRequest(userId: string, id: string, accept: boolean) {
  const convo = await prisma.conversation.findUnique({ where: { id }, include });
  if (!convo || (convo.userAId !== userId && convo.userBId !== userId)) throw notFound("Conversation");
  if (convo.initiatorId === userId) throw forbidden("Only the recipient can respond to a request.");
  if (convo.status !== "PENDING") throw badRequest("This request was already answered.");
  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      status: accept ? "ACCEPTED" : "DECLINED",
      // Responding means the recipient has seen the request message.
      ...(convo.userAId === userId ? { unreadA: 0 } : { unreadB: 0 }),
    },
    include,
  });
  if (accept) {
    void notify({ userId: convo.initiatorId, type: "DM_ACCEPTED", actorId: userId, conversationId: id });
    emitToUser(convo.initiatorId, "dm:accepted", { conversationId: id });
  }
  return shape(updated, userId);
}

export async function messages(userId: string, id: string, cursor: string | undefined, limit: number) {
  const convo = await prisma.conversation.findUnique({ where: { id }, select: { userAId: true, userBId: true } });
  if (!convo || (convo.userAId !== userId && convo.userBId !== userId)) throw notFound("Conversation");
  const rows = await prisma.message.findMany({
    where: { conversationId: id },
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "desc" },
    include: { sender: { select: authorSelect } },
  });
  const page = paginate(rows, limit);
  return { ...page, data: page.data.reverse() };
}

export async function sendMessage(userId: string, id: string, content: string) {
  const convo = await prisma.conversation.findUnique({ where: { id } });
  if (!convo || (convo.userAId !== userId && convo.userBId !== userId)) throw notFound("Conversation");
  if (convo.status === "DECLINED") throw forbidden("This conversation is closed.", "DECLINED");
  if (convo.status === "PENDING" && convo.initiatorId === userId) {
    throw forbidden("Wait for them to accept your request before sending more.", "REQUEST_PENDING");
  }
  const otherId = convo.userAId === userId ? convo.userBId : convo.userAId;
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: userId, blockedId: otherId }, { blockerId: otherId, blockedId: userId }] },
    select: { id: true },
  });
  if (blocked) throw forbidden("You can't message this person.", "BLOCKED");

  const crisis = scanCrisis(content);
  const message = await prisma.message.create({
    data: { conversationId: id, senderId: userId, content, riskLevel: crisis.level === "NONE" ? "NONE" : crisis.level },
    include: { sender: { select: authorSelect } },
  });
  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessageAt: message.createdAt,
      lastMessagePreview: content.slice(0, 80),
      // Recipient replying to a pending request implicitly accepts it.
      ...(convo.status === "PENDING" ? { status: "ACCEPTED" } : {}),
      ...(convo.userAId === otherId ? { unreadA: { increment: 1 } } : { unreadB: { increment: 1 } }),
    },
  });
  emitToUser(otherId, "dm:message", { conversationId: id, message });
  emitToUser(userId, "dm:message", { conversationId: id, message });
  void notify({ userId: otherId, type: "DM_MESSAGE", actorId: userId, conversationId: id });
  void moderateMessage(message.id, content, userId, crisis.level);
  return message;
}

export async function markRead(userId: string, id: string) {
  const convo = await prisma.conversation.findUnique({ where: { id }, select: { userAId: true, userBId: true } });
  if (!convo || (convo.userAId !== userId && convo.userBId !== userId)) throw notFound("Conversation");
  await prisma.conversation.update({
    where: { id },
    data: convo.userAId === userId ? { unreadA: 0 } : { unreadB: 0 },
  });
  const otherId = convo.userAId === userId ? convo.userBId : convo.userAId;
  emitToUser(otherId, "dm:read", { conversationId: id, by: userId });
}

export async function unreadTotal(userId: string) {
  const [a, b] = await Promise.all([
    prisma.conversation.aggregate({ where: { userAId: userId, status: "ACCEPTED" }, _sum: { unreadA: true } }),
    prisma.conversation.aggregate({ where: { userBId: userId, status: "ACCEPTED" }, _sum: { unreadB: true } }),
  ]);
  const requests = await prisma.conversation.count({ where: { status: "PENDING", NOT: { initiatorId: userId }, OR: [{ userAId: userId }, { userBId: userId }] } });
  return { messages: (a._sum.unreadA ?? 0) + (b._sum.unreadB ?? 0), requests };
}
