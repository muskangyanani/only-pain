import { Hono } from "hono";
import { optionalAuth } from "../middleware/auth.js";
import * as exploreController from "../controllers/explore.controller.js";
import type { AppVariables } from "../app.js";

const explore = new Hono<{ Variables: AppVariables }>();

explore.get("/posts", optionalAuth, exploreController.searchPosts);
explore.get("/users", optionalAuth, exploreController.searchUsers);
explore.get("/tags/:tag", optionalAuth, exploreController.getPostsByTag);

export default explore;
