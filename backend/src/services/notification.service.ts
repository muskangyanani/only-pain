import { prisma } from "../lib/prisma.js";

export async function createNotification(
  userId: string,
  type: string,
  referenceId: string
) {
  return prisma.notification.create({
    data: { userId, type, referenceId },
  });
}

export async function getNotifications(
  userId: string,
  cursor: string | undefined,
  limit: number = 20
) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();

  return {
    data: notifications,
    nextCursor: notifications.at(-1)?.id ?? null,
    hasMore,
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { message: "All notifications marked as read" };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { count };
}
