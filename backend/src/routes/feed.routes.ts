import { Hono } from "hono";
import * as posts from "../services/post.service.js";
import { optionalAuth } from "../middleware/auth.js";
import { cursorQuery } from "../lib/pagination.js";
import { unauthorized } from "../lib/errors.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

router.get("/", optionalAuth, async (c) => {
  const tab = c.req.query("tab") ?? "latest";
  const { cursor, limit } = cursorQuery(c, 12);
  const userId = c.get("userId");
  if (tab === "foryou") {
    if (!userId) throw unauthorized("Log in to get a feed shaped around you.");
    return c.json({ success: true, ...(await posts.forYouFeed(userId, cursor, limit)) });
  }
  if (tab === "following") {
    if (!userId) throw unauthorized("Log in to see people you follow.");
    return c.json({ success: true, ...(await posts.followingFeed(userId, cursor, limit)) });
  }
  return c.json({ success: true, ...(await posts.latestFeed(userId, cursor, limit)) });
});

export default router;
