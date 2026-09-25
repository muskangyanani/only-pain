import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as circles from "../services/circle.service.js";
import * as posts from "../services/post.service.js";
import { validationHook } from "../middleware/validate.js";
import { loadUser, optionalAuth, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { cursorQuery } from "../lib/pagination.js";
import { CIRCLE_ICONS, LIMITS, TAGS } from "../lib/constants.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

router.get("/", optionalAuth, async (c) => {
  const q = c.req.query("q")?.trim().slice(0, 60);
  const mine = c.req.query("mine") === "1";
  return c.json({ success: true, data: await circles.listCircles(c.get("userId"), { q, mine }) });
});

const createSchema = z.object({
  name: z.string().trim().min(3).max(LIMITS.circleName),
  tagline: z.string().trim().min(3).max(LIMITS.circleTagline),
  description: z.string().trim().max(LIMITS.circleDescription).nullable().optional(),
  icon: z.enum(CIRCLE_ICONS).optional(),
  hue: z.number().int().min(0).max(360).optional(),
  tags: z.array(z.enum(TAGS)).max(4).default([]),
  guidelines: z.string().trim().max(LIMITS.circleDescription).nullable().optional(),
});

router.post("/", requireAuth, loadUser, rateLimit({ name: "circle-create", max: 5, windowSec: 86400, by: "user" }), zValidator("json", createSchema, validationHook), async (c) => {
  return c.json({ success: true, data: await circles.createCircle(c.get("userId")!, c.req.valid("json")) }, 201);
});

router.get("/:slug", optionalAuth, async (c) => c.json({ success: true, data: await circles.getCircle(c.req.param("slug"), c.get("userId")) }));
router.post("/:slug/join", requireAuth, loadUser, async (c) => c.json({ success: true, data: await circles.joinCircle(c.get("userId")!, c.req.param("slug")) }));
router.post("/:slug/leave", requireAuth, async (c) => c.json({ success: true, data: await circles.leaveCircle(c.get("userId")!, c.req.param("slug")) }));

router.get("/:slug/members", optionalAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c, 30);
  return c.json({ success: true, ...(await circles.circleMembers(c.req.param("slug"), cursor, limit)) });
});

router.get("/:slug/posts", optionalAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c, 12);
  const id = await circles.circleIdBySlug(c.req.param("slug"));
  return c.json({ success: true, ...(await posts.circleFeed(id, c.get("userId"), cursor, limit)) });
});

export default router;
