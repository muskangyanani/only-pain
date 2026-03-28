import { Context } from "hono";
import * as userService from "../services/user.service.js";

export async function getProfile(c: Context) {
  try {
    const username = c.req.param("username")!;
    const userId = c.get("userId");
    const profile = await userService.getProfile(username, userId);
    return c.json({ success: true, data: profile });
  } catch (err) {
    return c.json({ success: false, error: "User not found" }, 404);
  }
}

export async function getUserPosts(c: Context) {
  try {
    const username = c.req.param("username")!;
    const cursor = c.req.query("cursor") || undefined;
    const limit = Math.min(Number(c.req.query("limit")) || 10, 50);
    const result = await userService.getUserPosts(username, cursor, limit);
    return c.json({ success: true, ...result });
  } catch (err) {
    return c.json({ success: false, error: "User not found" }, 404);
  }
}

export async function getMyAnonymousPosts(c: Context) {
  const userId = c.get("userId");
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 10, 50);
  const result = await userService.getMyAnonymousPosts(userId, cursor, limit);
  return c.json({ success: true, ...result });
}
