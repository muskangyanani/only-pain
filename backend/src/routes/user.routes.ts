import { Hono } from "hono";
import * as users from "../services/user.service.js";
import * as posts from "../services/post.service.js";
import * as follows from "../services/follow.service.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { cursorQuery } from "../lib/pagination.js";
import { notFound } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

router.get("/me/anonymous-posts", requireAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c, 12);
  return c.json({ success: true, ...(await posts.myAnonymousPosts(c.get("userId")!, cursor, limit)) });
});

router.get("/me/bookmarks", requireAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c, 12);
  return c.json({ success: true, ...(await posts.bookmarks(c.get("userId")!, cursor, limit)) });
});

router.get("/me/blocked", requireAuth, async (c) => c.json({ success: true, data: await follows.blockedUsers(c.get("userId")!) }));

router.get("/me/export", requireAuth, async (c) => {
  c.header("Content-Disposition", 'attachment; filename="onlypain-export.json"');
  return c.json(await users.exportData(c.get("userId")!));
});

router.get("/:username", optionalAuth, async (c) => c.json({ success: true, data: await users.getProfile(c.req.param("username"), c.get("userId")) }));

async function userIdByUsername(username: string) {
  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
  if (!user) throw notFound("User");
  return user.id;
}

router.get("/:username/posts", optionalAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c, 12);
  const id = await userIdByUsername(c.req.param("username"));
  return c.json({ success: true, ...(await posts.userPosts(id, c.get("userId"), cursor, limit)) });
});

router.get("/:username/followers", optionalAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c);
  return c.json({ success: true, ...(await follows.followers(await userIdByUsername(c.req.param("username")), cursor, limit)) });
});

router.get("/:username/following", optionalAuth, async (c) => {
  const { cursor, limit } = cursorQuery(c);
  return c.json({ success: true, ...(await follows.following(await userIdByUsername(c.req.param("username")), cursor, limit)) });
});

router.post("/:id/follow", requireAuth, async (c) => c.json({ success: true, data: await follows.toggleFollow(c.get("userId")!, c.req.param("id")) }));
router.post("/:id/block", requireAuth, async (c) => c.json({ success: true, data: await follows.toggleBlock(c.get("userId")!, c.req.param("id")) }));

export default router;
