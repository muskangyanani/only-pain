import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyAccessToken } from "../lib/jwt.js";
import type { AppVariables } from "../app.js";

export const authMiddleware = createMiddleware<{
  Variables: AppVariables;
}>(async (c, next) => {
  const token = getCookie(c, "access_token");

  if (!token) {
    return c.json({ success: false, error: "Authentication required" }, 401);
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }

  c.set("userId", payload.userId);
  await next();
});

export const optionalAuth = createMiddleware<{
  Variables: AppVariables;
}>(async (c, next) => {
  const token = getCookie(c, "access_token");

  if (token) {
    const payload = verifyAccessToken(token);
    c.set("userId", payload?.userId ?? null);
  } else {
    c.set("userId", null);
  }

  await next();
});
