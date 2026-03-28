import { Context } from "hono";
import * as feedService from "../services/feed.service.js";

export async function getHomeFeed(c: Context) {
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 10, 50);
  const userId = c.get("userId");

  const result = await feedService.getHomeFeed(cursor, limit, userId);
  return c.json({ success: true, ...result });
}
