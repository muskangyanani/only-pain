import { Context } from "hono";
import * as commentService from "../services/comment.service.js";

export async function createComment(c: Context) {
  try {
    const postId = c.req.param("postId")!;
    const userId = c.get("userId");
    const body = c.req.valid("json" as never);
    const comment = await commentService.createComment(postId, userId, body);
    return c.json({ success: true, data: comment }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create comment";
    return c.json({ success: false, error: message }, 400);
  }
}

export async function getComments(c: Context) {
  const postId = c.req.param("postId")!;
  const cursor = c.req.query("cursor") || undefined;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);

  const result = await commentService.getComments(postId, cursor, limit);
  return c.json({ success: true, ...result });
}

export async function deleteComment(c: Context) {
  try {
    const commentId = c.req.param("id")!;
    const userId = c.get("userId");
    const result = await commentService.deleteComment(commentId, userId);
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete comment";
    const status = message.includes("Not authorized") ? 403 : 404;
    return c.json({ success: false, error: message }, status);
  }
}
