import { Context } from "hono";
import * as reactionService from "../services/reaction.service.js";

export async function toggleReaction(c: Context) {
  try {
    const postId = c.req.param("postId")!;
    const userId = c.get("userId");
    const result = await reactionService.toggleReaction(postId, userId);
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to react";
    return c.json({ success: false, error: message }, 400);
  }
}
