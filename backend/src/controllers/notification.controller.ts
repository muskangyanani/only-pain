import { Context } from "hono";
import * as notificationService from "../services/notification.service.js";

export async function getNotifications(c: Context) {
  const userId = c.get("userId");
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);
  const result = await notificationService.getNotifications(userId, cursor, limit);
  return c.json({ success: true, ...result });
}

export async function markAsRead(c: Context) {
  try {
    const notificationId = c.req.param("id")!;
    const userId = c.get("userId");
    await notificationService.markAsRead(notificationId, userId);
    return c.json({ success: true, data: { message: "Marked as read" } });
  } catch (err) {
    return c.json({ success: false, error: "Notification not found" }, 404);
  }
}

export async function markAllRead(c: Context) {
  const userId = c.get("userId");
  const result = await notificationService.markAllRead(userId);
  return c.json({ success: true, data: result });
}

export async function getUnreadCount(c: Context) {
  const userId = c.get("userId");
  const result = await notificationService.getUnreadCount(userId);
  return c.json({ success: true, data: result });
}
