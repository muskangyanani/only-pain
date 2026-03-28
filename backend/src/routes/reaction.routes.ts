import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import * as reactionController from "../controllers/reaction.controller.js";
import type { AppVariables } from "../app.js";

const reactions = new Hono<{ Variables: AppVariables }>();

reactions.post("/:postId/react", authMiddleware, reactionController.toggleReaction);

export default reactions;
