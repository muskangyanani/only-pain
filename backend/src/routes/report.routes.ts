import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as moderation from "../services/moderation.service.js";
import { validationHook } from "../middleware/validate.js";
import { loadUser, requireAuth, requireRole } from "../middleware/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { cursorQuery } from "../lib/pagination.js";
import type { AppVariables } from "../types.js";

export const reportRouter = new Hono<{ Variables: AppVariables }>();

reportRouter.post(
  "/",
  requireAuth,
  loadUser,
  rateLimit({ name: "report", max: 30, windowSec: 86400, by: "user" }),
  zValidator(
    "json",
    z.object({
      postId: z.string().length(24).nullable().optional(),
      commentId: z.string().length(24).nullable().optional(),
      userId: z.string().length(24).nullable().optional(),
      reason: z.enum(["SELF_HARM_RISK", "HARMFUL_CONTENT", "HARASSMENT", "HATE", "SPAM", "OTHER"]),
      details: z.string().trim().max(500).nullable().optional(),
    }),
    validationHook
  ),
  async (c) => c.json({ success: true, data: { id: (await moderation.createReport(c.get("userId")!, c.req.valid("json"))).id } }, 201)
);

export const modRouter = new Hono<{ Variables: AppVariables }>();
modRouter.use("*", requireAuth, loadUser, requireRole("MOD", "ADMIN"));

modRouter.get("/stats", async (c) => c.json({ success: true, data: await moderation.stats() }));
modRouter.get("/reports", async (c) => {
  const status = (["OPEN", "RESOLVED", "DISMISSED"] as const).find((s) => s === c.req.query("status")) ?? "OPEN";
  const { cursor, limit } = cursorQuery(c, 25);
  return c.json({ success: true, ...(await moderation.queue(status, cursor, limit)) });
});
modRouter.post(
  "/reports/:id/resolve",
  zValidator("json", z.object({ action: z.enum(["dismiss", "hide", "restore", "remove", "ban", "unban"]), note: z.string().trim().max(300).nullable().optional() }), validationHook),
  async (c) => {
    const body = c.req.valid("json");
    return c.json({ success: true, data: await moderation.resolve(c.req.param("id"), c.get("userId")!, body.action, body.note) });
  }
);
