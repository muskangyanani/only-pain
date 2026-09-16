import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as dm from "../services/dm.service.js";
import { validationHook } from "../middleware/validate.js";
import { loadUser, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { cursorQuery } from "../lib/pagination.js";
import { LIMITS } from "../lib/constants.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();
router.use("*", requireAuth);

const content = z.string().trim().min(1, "Say something first").max(LIMITS.dm);

router.get("/unread", async (c) => c.json({ success: true, data: await dm.unreadTotal(c.get("userId")!) }));

router.get("/conversations", async (c) => {
  const filter = c.req.query("filter") === "requests" ? "requests" : "inbox";
  return c.json({ success: true, data: await dm.listConversations(c.get("userId")!, filter) });
});

router.post("/conversations", loadUser, rateLimit({ name: "dm-start", max: 20, windowSec: 86400, by: "user" }), zValidator("json", z.object({ userId: z.string().length(24), content }), validationHook), async (c) => {
  const body = c.req.valid("json");
  return c.json({ success: true, data: await dm.startConversation(c.get("userId")!, body.userId, body.content) }, 201);
});

router.get("/conversations/:id", async (c) => c.json({ success: true, data: await dm.getConversation(c.get("userId")!, c.req.param("id")) }));

router.get("/conversations/:id/messages", async (c) => {
  const { cursor, limit } = cursorQuery(c, 40);
  return c.json({ success: true, ...(await dm.messages(c.get("userId")!, c.req.param("id"), cursor, limit)) });
});

router.post("/conversations/:id/messages", loadUser, rateLimit({ name: "dm-send", max: 240, windowSec: 3600, by: "user" }), zValidator("json", z.object({ content }), validationHook), async (c) => {
  return c.json({ success: true, data: await dm.sendMessage(c.get("userId")!, c.req.param("id"), c.req.valid("json").content) }, 201);
});

router.post("/conversations/:id/accept", async (c) => c.json({ success: true, data: await dm.respondToRequest(c.get("userId")!, c.req.param("id"), true) }));
router.post("/conversations/:id/decline", async (c) => c.json({ success: true, data: await dm.respondToRequest(c.get("userId")!, c.req.param("id"), false) }));
router.post("/conversations/:id/read", async (c) => {
  await dm.markRead(c.get("userId")!, c.req.param("id"));
  return c.json({ success: true, data: { read: true } });
});

export default router;
