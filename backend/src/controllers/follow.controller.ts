import { Context } from "hono";
import * as followService from "../services/follow.service.js";

export async function toggleFollow(c: Context) {
  try {
    const followingId = c.req.param("userId")!;
    const followerId = c.get("userId");
    const result = await followService.toggleFollow(followerId, followingId);
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return c.json({ success: false, error: message }, 400);
  }
}

export async function getFollowers(c: Context) {
  const userId = c.req.param("userId")!;
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);
  const result = await followService.getFollowers(userId, cursor, limit);
  return c.json({ success: true, ...result });
}

export async function getFollowing(c: Context) {
  const userId = c.req.param("userId")!;
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);
  const result = await followService.getFollowing(userId, cursor, limit);
  return c.json({ success: true, ...result });
}
