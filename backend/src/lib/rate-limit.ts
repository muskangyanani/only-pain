import { createMiddleware } from "hono/factory";
import { env } from "./env.js";
import { getRedis } from "./redis.js";
import { clientIp } from "./ip.js";
import type { AppVariables } from "../types.js";

type Options = {
  name: string;
  max: number;
  windowSec: number;
  /** "ip" (default) or "user" — falls back to ip when unauthenticated. */
  by?: "ip" | "user";
};

// In-memory fallback for single-instance deployments / local dev.
const memory = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memory) if (now > v.resetAt) memory.delete(k);
}, 60_000).unref();

async function hit(key: string, windowSec: number): Promise<{ count: number; resetAt: number }> {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    const results = await redis.multi().incr(key).pttl(key).exec();
    const count = Number(results?.[0]?.[1] ?? 1);
    let ttl = Number(results?.[1]?.[1] ?? -1);
    if (ttl < 0) {
      await redis.pexpire(key, windowSec * 1000);
      ttl = windowSec * 1000;
    }
    return { count, resetAt: Date.now() + ttl };
  }
  const now = Date.now();
  const rec = memory.get(key);
  if (!rec || now > rec.resetAt) {
    const fresh = { count: 1, resetAt: now + windowSec * 1000 };
    memory.set(key, fresh);
    return fresh;
  }
  rec.count += 1;
  return rec;
}

export function rateLimit({ name, max, windowSec, by = "ip" }: Options) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    if (env.RATE_LIMIT_DISABLED === "1") return next();
    const userId = by === "user" ? c.get("userId") : null;
    const id = userId ?? `ip:${clientIp(c)}`;
    const { count, resetAt } = await hit(`rl:${name}:${id}`, windowSec);
    const remaining = Math.max(0, max - count);
    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(remaining));
    if (count > max) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
      c.header("Retry-After", String(retryAfter));
      return c.json(
        {
          success: false,
          error: "Slow down a little — you've hit a rate limit. Try again shortly.",
          code: "RATE_LIMITED",
          retryAfter,
        },
        429
      );
    }
    await next();
  });
}
