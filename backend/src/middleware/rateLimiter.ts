import { createMiddleware } from "hono/factory";

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (now > value.resetAt) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const loginRateLimiter = createMiddleware(async (c, next) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const record = attempts.get(ip);

  if (record) {
    if (now > record.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else if (record.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return c.json(
        {
          success: false,
          error: `Too many login attempts. Try again in ${retryAfter} seconds.`,
        },
        429
      );
    } else {
      record.count++;
    }
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  await next();
});
