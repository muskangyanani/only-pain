import { Hono } from "hono";
import { optionalAuth } from "../middleware/auth.js";
import * as feedController from "../controllers/feed.controller.js";
import type { AppVariables } from "../app.js";

const feed = new Hono<{ Variables: AppVariables }>();

feed.get("/", optionalAuth, feedController.getHomeFeed);

export default feed;
