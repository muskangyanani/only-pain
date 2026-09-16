import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  REFRESH_TTL_SEC,
  signAccessToken,
  signRefreshToken,
  signSocketToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import { randomToken, sha256 } from "../lib/crypto.js";
import { badRequest, conflict, forbidden, unauthorized } from "../lib/errors.js";
import { adminEmails } from "../lib/env.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/email.js";
import { RESERVED_USERNAMES } from "../lib/constants.js";
import { logger } from "../lib/logger.js";

export const meSelect = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  pronouns: true,
  avatarUrl: true,
  bio: true,
  struggles: true,
  onboardedAt: true,
  emailVerified: true,
  role: true,
  plan: true,
  planRenewsAt: true,
  subscriptionStatus: true,
  dmPrivacy: true,
  showMoodOnProfile: true,
  emailNotifications: true,
  createdAt: true,
} as const;

export type SessionMeta = { userAgent?: string; ip?: string };

// A dummy hash so that login timing is similar whether or not the user exists.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8ZtIXo5kV1ZKOB0a7Cq7O1u7gpgD9K";

async function issueSession(userId: string, meta: SessionMeta) {
  const session = await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: "",
      userAgent: meta.userAgent?.slice(0, 200),
      ip: meta.ip,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    },
  });
  const refreshToken = await signRefreshToken(userId, session.id);
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { tokenHash: sha256(refreshToken) },
  });
  const accessToken = await signAccessToken(userId);
  return { accessToken, refreshToken };
}

export async function signup(
  input: { username: string; email: string; password: string; displayName?: string },
  meta: SessionMeta
) {
  const username = input.username.toLowerCase();
  const email = input.email.toLowerCase();
  if (RESERVED_USERNAMES.has(username)) throw badRequest("That username is reserved.", "USERNAME_RESERVED");

  const [emailTaken, usernameTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ]);
  if (emailTaken) throw conflict("An account with that email already exists.", "EMAIL_TAKEN");
  if (usernameTaken) throw conflict("That username is taken.", "USERNAME_TAKEN");

  const verifyRaw = randomToken();
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName?.trim() || null,
      role: adminEmails.has(email) ? "ADMIN" : "USER",
      emailVerifyTokenHash: sha256(verifyRaw),
      emailVerifyExpires: new Date(Date.now() + 24 * 3600 * 1000),
    },
    select: meSelect,
  });

  sendVerificationEmail(email, verifyRaw).catch((err) => logger.warn({ err }, "verification email failed"));
  const tokens = await issueSession(user.id, meta);
  return { user, ...tokens };
}

export async function login(identifier: string, password: string, meta: SessionMeta) {
  const id = identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: id }, { email: id }] },
    select: { ...meSelect, passwordHash: true, isBanned: true, bannedReason: true },
  });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw unauthorized("That username/email and password don't match.", "BAD_CREDENTIALS");
  if (user.isBanned) throw forbidden("This account has been suspended.", "BANNED");

  const { passwordHash: _ph, isBanned: _b, bannedReason: _r, ...safe } = user;
  void _ph;
  void _b;
  void _r;
  prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } }).catch(() => {});
  const tokens = await issueSession(user.id, meta);
  return { user: safe, ...tokens };
}

/** Rotates the refresh token; detects reuse of a stale token and revokes that session. */
export async function refresh(currentRefreshToken: string) {
  const payload = await verifyRefreshToken(currentRefreshToken);
  if (!payload?.jti) throw unauthorized("Session expired", "SESSION_EXPIRED");

  const session = await prisma.refreshSession.findUnique({ where: { id: payload.jti } });
  if (!session || session.userId !== payload.userId || session.expiresAt < new Date()) {
    throw unauthorized("Session expired", "SESSION_EXPIRED");
  }
  if (session.tokenHash !== sha256(currentRefreshToken)) {
    // Token reuse — someone is replaying an old refresh token. Kill the session.
    await prisma.refreshSession.delete({ where: { id: session.id } }).catch(() => {});
    throw unauthorized("Session expired", "SESSION_EXPIRED");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, isBanned: true },
  });
  if (!user || user.isBanned) throw unauthorized("Session expired", "SESSION_EXPIRED");

  const refreshToken = await signRefreshToken(user.id, session.id);
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: {
      tokenHash: sha256(refreshToken),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    },
  });
  const accessToken = await signAccessToken(user.id);
  return { accessToken, refreshToken };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  const payload = await verifyRefreshToken(refreshToken);
  if (payload?.jti) await prisma.refreshSession.deleteMany({ where: { id: payload.jti } });
}

export async function logoutEverywhere(userId: string) {
  await prisma.refreshSession.deleteMany({ where: { userId } });
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: meSelect });
  if (!user) throw unauthorized("Account no longer exists", "ACCOUNT_GONE");
  return user;
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { emailVerifyTokenHash: sha256(token), emailVerifyExpires: { gt: new Date() } },
    select: { id: true },
  });
  if (!user) throw badRequest("This verification link is invalid or has expired.", "BAD_TOKEN");
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyTokenHash: null, emailVerifyExpires: null },
  });
}

export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!user) throw unauthorized();
  if (user.emailVerified) return;
  const raw = randomToken();
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifyTokenHash: sha256(raw), emailVerifyExpires: new Date(Date.now() + 24 * 3600 * 1000) },
  });
  await sendVerificationEmail(user.email, raw);
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (!user) return; // never reveal whether the email exists
  const raw = randomToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetHash: sha256(raw), passwordResetExpires: new Date(Date.now() + 3600 * 1000) },
  });
  await sendPasswordResetEmail(email.toLowerCase(), raw);
}

export async function resetPassword(token: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { passwordResetHash: sha256(token), passwordResetExpires: { gt: new Date() } },
    select: { id: true },
  });
  if (!user) throw badRequest("This reset link is invalid or has expired.", "BAD_TOKEN");
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password), passwordResetHash: null, passwordResetExpires: null },
    }),
    prisma.refreshSession.deleteMany({ where: { userId: user.id } }),
  ]);
}

export const socketToken = (userId: string) => signSocketToken(userId);

export async function listSessions(userId: string, currentRefreshToken: string | undefined) {
  const current = currentRefreshToken ? await verifyRefreshToken(currentRefreshToken) : null;
  const sessions = await prisma.refreshSession.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
    select: { id: true, userAgent: true, ip: true, createdAt: true, lastUsedAt: true },
  });
  return sessions.map((s) => ({ ...s, isCurrent: s.id === current?.jti }));
}

export async function revokeSession(userId: string, sessionId: string) {
  await prisma.refreshSession.deleteMany({ where: { id: sessionId, userId } });
}
