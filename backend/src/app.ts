import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { bodyLimit } from "hono/body-limit";
import { env, isTest } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { rateLimit } from "./lib/rate-limit.js";
import { errorHandler } from "./middleware/error-handler.js";
import type { AppVariables } from "./types.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import feedRoutes from "./routes/feed.routes.js";
import exploreRoutes from "./routes/explore.routes.js";
import userRoutes from "./routes/user.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import circleRoutes from "./routes/circle.routes.js";
import dmRoutes from "./routes/dm.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import moodRoutes from "./routes/mood.routes.js";
import companionRoutes from "./routes/companion.routes.js";
import toolsRoutes from "./routes/tools.routes.js";
import { reportRouter, modRouter } from "./routes/report.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import metaRoutes from "./routes/meta.routes.js";

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", requestId());
app.use("*", secureHeaders());
app.use("*", cors({ origin: env.CLIENT_URL, credentials: true, maxAge: 600 }));

if (!isTest) {
  app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    const line = { method: c.req.method, path: c.req.path, status: c.res.status, ms, requestId: c.get("requestId") };
    if (c.res.status >= 500) logger.error(line, "request");
    else if (c.res.status >= 400) logger.warn(line, "request");
    else logger.info(line, "request");
  });
}

app.use("/api/*", bodyLimit({ maxSize: 256 * 1024 }));
app.use("/api/*", rateLimit({ name: "global", max: 900, windowSec: 900 }));

app.route("/api", metaRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/posts", postRoutes);
app.route("/api/feed", feedRoutes);
app.route("/api/explore", exploreRoutes);
app.route("/api/users", userRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/circles", circleRoutes);
app.route("/api/dm", dmRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/mood", moodRoutes);
app.route("/api/companion", companionRoutes);
app.route("/api/tools", toolsRoutes);
app.route("/api/reports", reportRouter);
app.route("/api/mod", modRouter);
app.route("/api/billing", billingRoutes);

app.get("/", (c) => c.json({ success: true, data: { name: "only pain api", docs: "/api/health" } }));
app.notFound((c) => c.json({ success: false, error: "Not found", code: "NOT_FOUND" }, 404));
app.onError(errorHandler);

export default app;
