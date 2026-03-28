import { Context } from "hono";
import * as postService from "../services/post.service.js";

export async function createPost(c: Context) {
  try {
    const userId = c.get("userId");
    const body = c.req.valid("json" as never);
    const post = await postService.createPost(userId, body);
    return c.json({ success: true, data: post }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create post";
    return c.json({ success: false, error: message }, 400);
  }
}

export async function getPost(c: Context) {
  try {
    const postId = c.req.param("id")!;
    const userId = c.get("userId");
    const post = await postService.getPost(postId, userId);
    return c.json({ success: true, data: post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Post not found";
    return c.json({ success: false, error: message }, 404);
  }
}

export async function deletePost(c: Context) {
  try {
    const postId = c.req.param("id")!;
    const userId = c.get("userId");
    const result = await postService.deletePost(postId, userId);
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete post";
    const status = message.includes("Not authorized") ? 403 : 404;
    return c.json({ success: false, error: message }, status);
  }
}
