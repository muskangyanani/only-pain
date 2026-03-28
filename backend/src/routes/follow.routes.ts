import { Hono } from "hono";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import * as followController from "../controllers/follow.controller.js";
import type { AppVariables } from "../app.js";

const follow = new Hono<{ Variables: AppVariables }>();

follow.post("/:userId/follow", authMiddleware, followController.toggleFollow);
follow.get("/:userId/followers", optionalAuth, followController.getFollowers);
follow.get("/:userId/following", optionalAuth, followController.getFollowing);

export default follow;
