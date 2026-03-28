import { Context } from "hono";
import * as exploreService from "../services/explore.service.js";

export async function searchPosts(c: Context) {
  const query = c.req.query("q") || "";
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 10, 50);

  if (!query) {
    return c.json({ success: true, data: [], nextCursor: null, hasMore: false });
  }

  const result = await exploreService.searchPosts(query, cursor, limit);
  return c.json({ success: true, ...result });
}

export async function searchUsers(c: Context) {
  const query = c.req.query("q") || "";
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 10, 50);

  if (!query) {
    return c.json({ success: true, data: [], nextCursor: null, hasMore: false });
  }

  const result = await exploreService.searchUsers(query, cursor, limit);
  return c.json({ success: true, ...result });
}

export async function getPostsByTag(c: Context) {
  const tag = c.req.param("tag")!;
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 10, 50);

  const result = await exploreService.getPostsByTag(tag, cursor, limit);
  return c.json({ success: true, ...result });
}
