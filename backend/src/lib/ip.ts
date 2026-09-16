import type { Context } from "hono";

/** Best-effort client IP behind common proxies (Railway, Vercel, Fly, Render). */
export function clientIp(c: Context): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || "unknown";
}
