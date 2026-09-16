import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { streamSSE } from "hono/streaming";
import * as companion from "../services/companion.service.js";
import { validationHook } from "../middleware/validate.js";
import { loadUser, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { LIMITS } from "../lib/constants.js";
import { logger } from "../lib/logger.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();
router.use("*", requireAuth);

router.get("/sessions", async (c) => c.json({ success: true, data: await companion.listSessions(c.get("userId")!) }));
router.post("/sessions", rateLimit({ name: "companion-new", max: 40, windowSec: 86400, by: "user" }), async (c) => c.json({ success: true, data: await companion.createSession(c.get("userId")!) }, 201));
router.delete("/sessions", async (c) => {
  await companion.deleteAll(c.get("userId")!);
  return c.json({ success: true, data: { deleted: true } });
});
router.get("/sessions/:id", async (c) => c.json({ success: true, data: await companion.getSession(c.get("userId")!, c.req.param("id")) }));
router.delete("/sessions/:id", async (c) => {
  await companion.deleteSession(c.get("userId")!, c.req.param("id"));
  return c.json({ success: true, data: { deleted: true } });
});

/** Server-sent events: `meta` → `delta`* → `done` (or `error`). */
router.post(
  "/sessions/:id/messages",
  loadUser,
  rateLimit({ name: "companion-msg", max: 400, windowSec: 86400, by: "user" }),
  zValidator("json", z.object({ content: z.string().trim().min(1).max(LIMITS.companion) }), validationHook),
  async (c) => {
    const { meta, stream } = await companion.startReply(c.get("currentUser")!, c.req.param("id"), c.req.valid("json").content);
    return streamSSE(c, async (sse) => {
      await sse.writeSSE({ event: "meta", data: JSON.stringify(meta) });
      try {
        for await (const ev of stream()) {
          await sse.writeSSE({ event: ev.type, data: JSON.stringify(ev) });
        }
      } catch (err) {
        logger.error({ err }, "companion sse failed");
        await sse.writeSSE({ event: "error", data: JSON.stringify({ error: "Ember lost the thread. Try again?", code: "STREAM_FAILED" }) });
      }
    });
  }
);

export default router;
