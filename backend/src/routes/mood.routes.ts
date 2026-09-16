import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as mood from "../services/mood.service.js";
import { validationHook } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { FEELINGS } from "../lib/constants.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();
router.use("*", requireAuth);

router.put(
  "/today",
  zValidator("json", z.object({ dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), score: z.number().int().min(1).max(5), feelings: z.array(z.enum(FEELINGS)).max(5).default([]), note: z.string().trim().max(280).nullable().optional() }), validationHook),
  async (c) => c.json({ success: true, data: await mood.checkIn(c.get("userId")!, c.req.valid("json")) })
);
router.get("/", async (c) => {
  const days = Math.min(Math.max(Number(c.req.query("days")) || 30, 7), 365);
  return c.json({ success: true, data: await mood.history(c.get("userId")!, days) });
});
router.get("/summary", async (c) => c.json({ success: true, data: await mood.summary(c.get("userId")!) }));

export default router;
