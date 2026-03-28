import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import * as notificationController from "../controllers/notification.controller.js";
import type { AppVariables } from "../app.js";

const notifications = new Hono<{ Variables: AppVariables }>();

notifications.get("/", authMiddleware, notificationController.getNotifications);
notifications.get("/unread-count", authMiddleware, notificationController.getUnreadCount);
notifications.patch("/:id/read", authMiddleware, notificationController.markAsRead);
notifications.patch("/read-all", authMiddleware, notificationController.markAllRead);

export default notifications;
