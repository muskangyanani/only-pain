import { createMiddleware } from "hono/factory";
import type { Role } from "@prisma/client";
import { readAccessCookie } from "../lib/cookies.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { prisma } from "../lib/prisma.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import type { AppVariables } from "../types.js";

function bearer(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice(7);
}

async function resolveUserId(cookieToken: string | undefined, authHeader: string | undefined) {
  const token = cookieToken ?? bearer(authHeader);
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload?.userId ?? null;
}

/** Sets userId or null; never rejects. */
export const optionalAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  c.set("userId", await resolveUserId(readAccessCookie(c), c.req.header("authorization")));
  await next();
});

/** Rejects with 401 when no valid access token is present. */
export const requireAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const userId = await resolveUserId(readAccessCookie(c), c.req.header("authorization"));
  if (!userId) throw unauthorized();
  c.set("userId", userId);
  await next();
});

/** Loads the user row (role/plan/ban) — use for privileged or write-heavy routes. */
export const loadUser = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const userId = c.get("userId");
  if (!userId) throw unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, plan: true, isBanned: true, username: true },
  });
  if (!user) throw unauthorized("Account no longer exists", "ACCOUNT_GONE");
  if (user.isBanned) throw forbidden("This account has been suspended.", "BANNED");
  c.set("currentUser", user);
  await next();
});

export function requireRole(...roles: Role[]) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const user = c.get("currentUser");
    if (!user || !roles.includes(user.role)) throw forbidden("Moderator access required", "ROLE_REQUIRED");
    await next();
  });
}
