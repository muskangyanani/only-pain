import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as tools from "../services/tools.service.js";
import { validationHook } from "../middleware/validate.js";
import { loadUser, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { LIMITS } from "../lib/constants.js";
import { prisma } from "../lib/prisma.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();
router.use("*", requireAuth, loadUser);

router.get("/status", async (c) => c.json({ success: true, data: await tools.aiStatus(c.get("currentUser")!) }));

router.post("/reframe", rateLimit({ name: "reframe", max: 60, windowSec: 86400, by: "user" }), zValidator("json", z.object({ thought: z.string().trim().min(3, "Write the thought out first").max(LIMITS.thought) }), validationHook), async (c) => {
  return c.json({ success: true, data: await tools.reframe(c.get("currentUser")!, c.req.valid("json").thought) }, 201);
});
router.get("/reframe", async (c) => c.json({ success: true, data: await tools.reframeHistory(c.get("userId")!) }));
router.delete("/reframe/:id", async (c) => {
  await tools.deleteReframe(c.get("userId")!, c.req.param("id"));
  return c.json({ success: true, data: { deleted: true } });
});

async function withName(c: { get: (k: "currentUser") => AppVariables["currentUser"] }) {
  const user = c.get("currentUser")!;
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true } });
  return { ...user, displayName: row?.displayName ?? null };
}

router.get("/reflection", async (c) => c.json({ success: true, data: await tools.reflection(await withName(c)) }));
router.post("/reflection", rateLimit({ name: "reflection", max: 10, windowSec: 86400, by: "user" }), async (c) => c.json({ success: true, data: await tools.reflection(await withName(c), true) }));

export default router;
