import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as users from "../services/user.service.js";
import { validationHook } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { readRefreshCookie, clearAuthCookies } from "../lib/cookies.js";
import { verifyRefreshToken } from "../lib/tokens.js";
import { LIMITS, STRUGGLES, USERNAME_RE } from "../lib/constants.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

const profileSchema = z.object({
  displayName: z.string().trim().max(LIMITS.displayName).nullable().optional(),
  pronouns: z.string().trim().max(24).nullable().optional(),
  bio: z.string().trim().max(LIMITS.bio).nullable().optional(),
  avatarUrl: z.url().nullable().optional(),
  struggles: z.array(z.enum(STRUGGLES)).max(6).optional(),
  showMoodOnProfile: z.boolean().optional(),
  dmPrivacy: z.enum(["EVERYONE", "FOLLOWING", "NOBODY"]).optional(),
  emailNotifications: z.boolean().optional(),
});

router.patch("/profile", requireAuth, zValidator("json", profileSchema, validationHook), async (c) => {
  return c.json({ success: true, data: await users.updateProfile(c.get("userId")!, c.req.valid("json")) });
});

router.post(
  "/onboarding",
  requireAuth,
  zValidator("json", z.object({ struggles: z.array(z.enum(STRUGGLES)).max(6), displayName: z.string().trim().max(LIMITS.displayName).nullable().optional(), pronouns: z.string().trim().max(24).nullable().optional() }), validationHook),
  async (c) => c.json({ success: true, data: await users.completeOnboarding(c.get("userId")!, c.req.valid("json")) })
);

router.patch("/username", requireAuth, zValidator("json", z.object({ username: z.string().trim().toLowerCase().regex(USERNAME_RE, "3–20 characters: lowercase letters, numbers, underscores") }), validationHook), async (c) => {
  return c.json({ success: true, data: await users.changeUsername(c.get("userId")!, c.req.valid("json").username) });
});

router.patch("/email", requireAuth, zValidator("json", z.object({ email: z.email(), password: z.string().min(1) }), validationHook), async (c) => {
  const body = c.req.valid("json");
  return c.json({ success: true, data: await users.changeEmail(c.get("userId")!, body.email, body.password) });
});

router.patch("/password", requireAuth, zValidator("json", z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, "Use at least 8 characters").max(128) }), validationHook), async (c) => {
  const body = c.req.valid("json");
  const current = readRefreshCookie(c);
  const keep = current ? (await verifyRefreshToken(current))?.jti ?? null : null;
  await users.changePassword(c.get("userId")!, body.currentPassword, body.newPassword, keep);
  return c.json({ success: true, data: { changed: true } });
});

router.delete("/account", requireAuth, zValidator("json", z.object({ password: z.string().min(1) }), validationHook), async (c) => {
  await users.deleteAccount(c.get("userId")!, c.req.valid("json").password);
  clearAuthCookies(c);
  return c.json({ success: true, data: { deleted: true } });
});

export default router;
