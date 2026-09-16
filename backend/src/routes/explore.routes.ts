import { Hono } from "hono";
import * as posts from "../services/post.service.js";
import * as users from "../services/user.service.js";
import * as explore from "../services/explore.service.js";
import * as match from "../services/match.service.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { cursorQuery } from "../lib/pagination.js";
import { TAGS } from "../lib/constants.js";
import { badRequest } from "../lib/errors.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

router.get("/search", optionalAuth, async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 80);
  const type = c.req.query("type") === "users" ? "users" : "posts";
  const { cursor, limit } = cursorQuery(c, 15);
  if (q.length < 2) return c.json({ success: true, data: [], nextCursor: null, hasMore: false });
  const result = type === "users" ? await users.searchUsers(q, c.get("userId"), cursor, limit) : await posts.searchPosts(q, c.get("userId"), cursor, limit);
  return c.json({ success: true, ...result });
});

router.get("/tags", async (c) => c.json({ success: true, data: await explore.tagCounts() }));
router.get("/tags/trending", async (c) => c.json({ success: true, data: await explore.trendingTags() }));

router.get("/tags/:tag/posts", optionalAuth, async (c) => {
  const tag = c.req.param("tag");
  if (!(TAGS as readonly string[]).includes(tag)) throw badRequest("Unknown tag");
  const { cursor, limit } = cursorQuery(c, 12);
  return c.json({ success: true, ...(await posts.tagFeed(tag, c.get("userId"), cursor, limit)) });
});

router.get("/pulse", async (c) => c.json({ success: true, data: await explore.communityPulse() }));

router.get("/people", requireAuth, async (c) => c.json({ success: true, data: await match.peopleWhoGetIt(c.get("userId")!) }));

router.get("/circles/suggested", optionalAuth, async (c) => c.json({ success: true, data: await match.suggestedCircles(c.get("userId")) }));

export default router;
