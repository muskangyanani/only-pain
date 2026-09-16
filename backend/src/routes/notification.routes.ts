import { Hono } from "hono";
import * as notifications from "../services/notification.service.js";
import { requireAuth } from "../middleware/auth.js";
import { cursorQuery } from "../lib/pagination.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();
router.use("*", requireAuth);

router.get("/", async (c) => {
  const { cursor, limit } = cursorQuery(c, 25);
  return c.json({ success: true, ...(await notifications.list(c.get("userId")!, cursor, limit)) });
});
router.get("/unread-count", async (c) => c.json({ success: true, data: { count: await notifications.unreadCount(c.get("userId")!) } }));
router.patch("/read-all", async (c) => {
  await notifications.markAllRead(c.get("userId")!);
  return c.json({ success: true, data: { read: true } });
});
router.patch("/:id/read", async (c) => {
  await notifications.markRead(c.get("userId")!, c.req.param("id"));
  return c.json({ success: true, data: { read: true } });
});

export default router;
