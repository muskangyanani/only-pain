import { Hono } from "hono";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import * as userController from "../controllers/user.controller.js";
import type { AppVariables } from "../app.js";

const users = new Hono<{ Variables: AppVariables }>();

users.get("/me/anonymous-posts", authMiddleware, userController.getMyAnonymousPosts);
users.get("/:username", optionalAuth, userController.getProfile);
users.get("/:username/posts", optionalAuth, userController.getUserPosts);

export default users;
