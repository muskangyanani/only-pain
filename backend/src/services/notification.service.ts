import type { NotificationType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cursorArgs, paginate } from "../lib/pagination.js";
import { ANONYMOUS_AUTHOR } from "../lib/anonymize.js";
import { emitToUser } from "../socket/emitter.js";
import { notFound } from "../lib/errors.js";

const actorSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;

export const notificationInclude = {
  actor: { select: actorSelect },
  post: { select: { id: true, content: true, isAnonymous: true } },
  comment: { select: { id: true, content: true } },
  circle: { select: { id: true, slug: true, name: true, emoji: true } },
} as const;

type Row = Awaited<ReturnType<typeof prisma.notification.findFirst<{ include: typeof notificationInclude }>>>;

export function formatNotification(n: NonNullable<Row>) {
  return {
    id: n.id,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt,
    message: n.message,
    actor: n.actorAnonymous || !n.actor ? { ...ANONYMOUS_AUTHOR } : n.actor,
    post: n.post ? { id: n.post.id, preview: n.post.content.slice(0, 90) } : null,
    comment: n.comment ? { id: n.comment.id, preview: n.comment.content.slice(0, 90) } : null,
    conversationId: n.conversationId,
    circle: n.circle,
  };
}

export async function notify(input: {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  actorAnonymous?: boolean;
  postId?: string | null;
  commentId?: string | null;
  conversationId?: string | null;
  circleId?: string | null;
  message?: string | null;
}) {
  if (input.actorId && input.actorId === input.userId) return null; // never notify yourself
  const created = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      actorId: input.actorId ?? null,
      actorAnonymous: input.actorAnonymous ?? false,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      conversationId: input.conversationId ?? null,
      circleId: input.circleId ?? null,
      message: input.message ?? null,
    },
    include: notificationInclude,
  });
  const payload = formatNotification(created);
  const unread = await prisma.notification.count({ where: { userId: input.userId, isRead: false } });
  emitToUser(input.userId, "notification:new", { notification: payload, unread });
  return payload;
}

export async function list(userId: string, cursor: string | undefined, limit: number) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "desc" },
    include: notificationInclude,
  });
  const page = paginate(rows, limit);
  return { ...page, data: page.data.map(formatNotification) };
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(userId: string, id: string) {
  const res = await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  if (res.count === 0) throw notFound("Notification");
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}
