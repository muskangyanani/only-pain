import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as posts from "../services/post.service.js";
import * as comments from "../services/comment.service.js";
import * as reactions from "../services/reaction.service.js";
import * as tools from "../services/tools.service.js";
import { validationHook } from "../middleware/validate.js";
import { loadUser, optionalAuth, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { cursorQuery } from "../lib/pagination.js";
import { CONTENT_WARNINGS, LIMITS, REACTIONS, TAGS } from "../lib/constants.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

const postBody = z.object({
  content: z.string().trim().min(1, "Say something first").max(LIMITS.post, `Keep it under ${LIMITS.post} characters`),
  tags: z.array(z.enum(TAGS)).max(3, "Up to 3 tags").default([]),
  isAnonymous: z.boolean().default(false),
  circleId: z.string().length(24).nullable().optional(),
  contentWarning: z.enum(CONTENT_WARNINGS).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
});

const commentBody = z.object({
  content: z.string().trim().min(1, "Say something first").max(LIMITS.comment),
  isAnonymous: z.boolean().default(false),
  parentCommentId: z.string().length(24).nullable().optional(),
});

router.post("/", requireAuth, loadUser, rateLimit({ name: "post", max: 30, windowSec: 3600, by: "user" }), zValidator("json", postBody, validationHook), async (c) => {
  const result = await posts.createPost(c.get("userId")!, c.req.valid("json"));
  return c.json({ success: true, data: result.post, safety: result.safety }, 201);
});

router.get("/:id", optionalAuth, async (c) => c.json({ success: true, data: await posts.getPost(c.req.param("id"), c.get("userId")) }));

router.patch("/:id", requireAuth, loadUser, zValidator("json", postBody.pick({ content: true, tags: true, contentWarning: true }), validationHook), async (c) => {
  return c.json({ success: true, data: await posts.updatePost(c.req.param("id"), c.get("userId")!, c.req.valid("json")) });
});

router.delete("/:id", requireAuth, loadUser, async (c) => {
  await posts.deletePost(c.req.param("id"), c.get("currentUser")!);
  return c.json({ success: true, data: { deleted: true } });
});

router.post("/:id/react", requireAuth, loadUser, rateLimit({ name: "react", max: 300, windowSec: 3600, by: "user" }), zValidator("json", z.object({ type: z.enum(REACTIONS).nullable() }), validationHook), async (c) => {
  return c.json({ success: true, data: await reactions.setReaction(c.req.param("id"), c.get("userId")!, c.req.valid("json").type) });
});

router.post("/:id/bookmark", requireAuth, async (c) => c.json({ success: true, data: await posts.toggleBookmark(c.get("userId")!, c.req.param("id")) }));

router.get("/:id/comments", optionalAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c, 30);
  return c.json({ success: true, ...(await comments.listComments(c.req.param("id"), c.get("userId"), cursor, limit)) });
});

router.post("/:id/comments", requireAuth, loadUser, rateLimit({ name: "comment", max: 120, windowSec: 3600, by: "user" }), zValidator("json", commentBody, validationHook), async (c) => {
  const result = await comments.createComment(c.req.param("id"), c.get("userId")!, c.req.valid("json"));
  return c.json({ success: true, data: result.comment, safety: result.safety }, 201);
});

router.delete("/comments/:id", requireAuth, loadUser, async (c) => {
  await comments.deleteComment(c.req.param("id"), c.get("currentUser")!);
  return c.json({ success: true, data: { deleted: true } });
});

router.post("/:id/reply-ideas", requireAuth, loadUser, rateLimit({ name: "reply-ideas", max: 60, windowSec: 3600, by: "user" }), async (c) => {
  return c.json({ success: true, data: await tools.replyIdeas(c.get("currentUser")!, c.req.param("id")) });
});

export default router;
