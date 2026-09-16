import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as auth from "../services/auth.service.js";
import { validationHook } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../lib/rate-limit.js";
import { clearAuthCookies, readRefreshCookie, setAuthCookies } from "../lib/cookies.js";
import { clientIp } from "../lib/ip.js";
import { USERNAME_RE } from "../lib/constants.js";
import { unauthorized } from "../lib/errors.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

const password = z.string().min(8, "Use at least 8 characters").max(128);

const signupSchema = z.object({
  username: z.string().trim().toLowerCase().regex(USERNAME_RE, "3–20 characters: lowercase letters, numbers, underscores"),
  email: z.email("Enter a valid email"),
  password,
  displayName: z.string().trim().max(40).optional(),
});

const loginSchema = z.object({ identifier: z.string().trim().min(1, "Enter your username or email"), password: z.string().min(1, "Enter your password") });

router.post("/signup", rateLimit({ name: "signup", max: 10, windowSec: 3600 }), zValidator("json", signupSchema, validationHook), async (c) => {
  const body = c.req.valid("json");
  const { user, accessToken, refreshToken } = await auth.signup(body, { userAgent: c.req.header("user-agent"), ip: clientIp(c) });
  setAuthCookies(c, accessToken, refreshToken);
  return c.json({ success: true, data: user }, 201);
});

router.post("/login", rateLimit({ name: "login", max: 10, windowSec: 900 }), zValidator("json", loginSchema, validationHook), async (c) => {
  const { identifier, password } = c.req.valid("json");
  const { user, accessToken, refreshToken } = await auth.login(identifier, password, { userAgent: c.req.header("user-agent"), ip: clientIp(c) });
  setAuthCookies(c, accessToken, refreshToken);
  return c.json({ success: true, data: user });
});

router.post("/refresh", rateLimit({ name: "refresh", max: 60, windowSec: 900 }), async (c) => {
  const current = readRefreshCookie(c);
  if (!current) throw unauthorized("No session", "NO_SESSION");
  try {
    const { accessToken, refreshToken } = await auth.refresh(current);
    setAuthCookies(c, accessToken, refreshToken);
    return c.json({ success: true, data: { refreshed: true } });
  } catch (err) {
    clearAuthCookies(c);
    throw err;
  }
});

router.post("/logout", async (c) => {
  await auth.logout(readRefreshCookie(c));
  clearAuthCookies(c);
  return c.json({ success: true, data: { loggedOut: true } });
});

router.post("/logout-all", requireAuth, async (c) => {
  await auth.logoutEverywhere(c.get("userId")!);
  clearAuthCookies(c);
  return c.json({ success: true, data: { loggedOut: true } });
});

router.get("/me", requireAuth, async (c) => c.json({ success: true, data: await auth.me(c.get("userId")!) }));

router.get("/verify-email", zValidator("query", z.object({ token: z.string().min(10) }), validationHook), async (c) => {
  await auth.verifyEmail(c.req.valid("query").token);
  return c.json({ success: true, data: { verified: true } });
});

router.post("/resend-verification", requireAuth, rateLimit({ name: "resend", max: 3, windowSec: 3600, by: "user" }), async (c) => {
  await auth.resendVerification(c.get("userId")!);
  return c.json({ success: true, data: { sent: true } });
});

router.post("/forgot-password", rateLimit({ name: "forgot", max: 5, windowSec: 3600 }), zValidator("json", z.object({ email: z.email() }), validationHook), async (c) => {
  await auth.forgotPassword(c.req.valid("json").email);
  return c.json({ success: true, data: { sent: true } });
});

router.post("/reset-password", rateLimit({ name: "reset", max: 10, windowSec: 3600 }), zValidator("json", z.object({ token: z.string().min(10), password }), validationHook), async (c) => {
  const body = c.req.valid("json");
  await auth.resetPassword(body.token, body.password);
  return c.json({ success: true, data: { reset: true } });
});

router.get("/socket-token", requireAuth, async (c) => c.json({ success: true, data: { token: await auth.socketToken(c.get("userId")!) } }));

router.get("/sessions", requireAuth, async (c) => c.json({ success: true, data: await auth.listSessions(c.get("userId")!, readRefreshCookie(c)) }));

router.delete("/sessions/:id", requireAuth, async (c) => {
  await auth.revokeSession(c.get("userId")!, c.req.param("id"));
  return c.json({ success: true, data: { revoked: true } });
});

export default router;
