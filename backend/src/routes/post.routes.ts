import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createPostSchema } from "../validators/post.validator.js";
import * as postController from "../controllers/post.controller.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import type { AppVariables } from "../app.js";

const posts = new Hono<{ Variables: AppVariables }>();

posts.post(
  "/",
  authMiddleware,
  zValidator("json", createPostSchema),
  postController.createPost
);

posts.get("/:id", optionalAuth, postController.getPost);

posts.delete("/:id", authMiddleware, postController.deletePost);

export default posts;
