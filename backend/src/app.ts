import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import feedRoutes from "./routes/feed.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import reactionRoutes from "./routes/reaction.routes.js";
import exploreRoutes from "./routes/explore.routes.js";
import followRoutes from "./routes/follow.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from "./routes/user.routes.js";
import settingsRoutes from "./routes/settings.routes.js";

export type AppVariables = {
  userId: string | null;
};

const app = new Hono<{ Variables: AppVariables }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ success: true, data: "ok" });
});

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/posts", postRoutes);
app.route("/api/posts", commentRoutes);
app.route("/api/posts", reactionRoutes);
app.route("/api/feed", feedRoutes);
app.route("/api/explore", exploreRoutes);
app.route("/api/users", followRoutes);
app.route("/api/users", userRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/settings", settingsRoutes);

// Global error handler
app.onError(errorHandler);

export default app;
