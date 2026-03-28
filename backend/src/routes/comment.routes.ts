import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createCommentSchema } from "../validators/comment.validator.js";
import * as commentController from "../controllers/comment.controller.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import type { AppVariables } from "../app.js";

const comments = new Hono<{ Variables: AppVariables }>();

// Nested under /api/posts/:postId/comments
comments.post(
  "/:postId/comments",
  authMiddleware,
  zValidator("json", createCommentSchema),
  commentController.createComment
);

comments.get("/:postId/comments", optionalAuth, commentController.getComments);

// Direct comment operations
comments.delete("/comments/:id", authMiddleware, commentController.deleteComment);

export default comments;
