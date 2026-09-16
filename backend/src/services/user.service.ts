import type { DmPrivacy } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { RESERVED_USERNAMES, STRUGGLES } from "../lib/constants.js";
import { randomToken, sha256 } from "../lib/crypto.js";
import { sendVerificationEmail } from "../lib/email.js";
import { daysAgo } from "../lib/dates.js";
import { meSelect } from "./auth.service.js";

const profileSelect = {
  id: true,
  username: true,
  displayName: true,
  pronouns: true,
  avatarUrl: true,
  bio: true,
  struggles: true,
  role: true,
  plan: true,
  showMoodOnProfile: true,
  dmPrivacy: true,
  lastActiveAt: true,
  createdAt: true,
  _count: {
    select: {
      posts: { where: { isAnonymous: false, moderation: "VISIBLE" } },
      followers: true,
      following: true,
    },
  },
} as const;

/** Can `viewerId` open a DM request to `target` under target's privacy setting? */
export async function canMessage(viewerId: string | null, target: { id: string; dmPrivacy: DmPrivacy }) {
  if (!viewerId || viewerId === target.id) return false;
  if (target.dmPrivacy === "NOBODY") return false;
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: viewerId, blockedId: target.id }, { blockerId: target.id, blockedId: viewerId }] },
    select: { id: true },
  });
  if (blocked) return false;
  if (target.dmPrivacy === "FOLLOWING") {
    const follows = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: target.id, followingId: viewerId } },
      select: { id: true },
    });
    return !!follows;
  }
  return true;
}

export async function getProfile(username: string, viewerId: string | null) {
  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: profileSelect });
  if (!user) throw notFound("User");
  const isOwn = viewerId === user.id;

  let isFollowing = false;
  let followsYou = false;
  let isBlocked = false;
  let sharedStruggles: string[] = [];
  if (viewerId && !isOwn) {
    const [a, b, blockRows, me] = await Promise.all([
      prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } } }),
      prisma.follow.findUnique({ where: { followerId_followingId: { followerId: user.id, followingId: viewerId } } }),
      prisma.block.findMany({
        where: { OR: [{ blockerId: viewerId, blockedId: user.id }, { blockerId: user.id, blockedId: viewerId }] },
      }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { struggles: true } }),
    ]);
    if (blockRows.some((r) => r.blockerId === user.id)) throw forbidden("This person isn't available.", "BLOCKED_BY");
    isFollowing = !!a;
    followsYou = !!b;
    isBlocked = blockRows.some((r) => r.blockerId === viewerId);
    sharedStruggles = user.struggles.filter((s) => me?.struggles.includes(s));
  }

  const moodRing =
    isOwn || user.showMoodOnProfile
      ? await prisma.moodEntry.findMany({
          where: { userId: user.id, createdAt: { gte: daysAgo(7) } },
          orderBy: { dayKey: "asc" },
          select: { dayKey: true, score: true },
        })
      : null;

  return {
    ...user,
    isOwn,
    isFollowing,
    followsYou,
    isBlocked,
    sharedStruggles,
    canMessage: await canMessage(viewerId, user),
    moodRing,
  };
}

export async function updateProfile(
  userId: string,
  input: {
    displayName?: string | null;
    pronouns?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    struggles?: string[];
    showMoodOnProfile?: boolean;
    dmPrivacy?: DmPrivacy;
    emailNotifications?: boolean;
  }
) {
  if (input.struggles) {
    const bad = input.struggles.filter((s) => !(STRUGGLES as readonly string[]).includes(s));
    if (bad.length) throw badRequest(`Unknown struggle: ${bad[0]}`);
  }
  return prisma.user.update({ where: { id: userId }, data: input, select: meSelect });
}

export async function completeOnboarding(
  userId: string,
  input: { struggles: string[]; displayName?: string | null; pronouns?: string | null }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      struggles: input.struggles,
      displayName: input.displayName ?? undefined,
      pronouns: input.pronouns ?? undefined,
      onboardedAt: new Date(),
    },
    select: meSelect,
  });
  // Gently drop the person into a couple of circles that match what they're carrying.
  if (input.struggles.length) {
    const circles = await prisma.circle.findMany({
      where: { isOfficial: true, tags: { hasSome: input.struggles } },
      orderBy: { memberCount: "desc" },
      take: 3,
      select: { id: true },
    });
    for (const c of circles) {
      await prisma.circleMember
        .create({ data: { circleId: c.id, userId } })
        .then(() => prisma.circle.update({ where: { id: c.id }, data: { memberCount: { increment: 1 } } }))
        .catch(() => {});
    }
  }
  return user;
}

export async function changeUsername(userId: string, username: string) {
  const u = username.toLowerCase();
  if (RESERVED_USERNAMES.has(u)) throw badRequest("That username is reserved.", "USERNAME_RESERVED");
  const taken = await prisma.user.findFirst({ where: { username: u, NOT: { id: userId } }, select: { id: true } });
  if (taken) throw conflict("That username is taken.", "USERNAME_TAKEN");
  return prisma.user.update({ where: { id: userId }, data: { username: u }, select: meSelect });
}

export async function changeEmail(userId: string, email: string, password: string) {
  const e = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw unauthorized("Password is incorrect.", "BAD_PASSWORD");
  const taken = await prisma.user.findFirst({ where: { email: e, NOT: { id: userId } }, select: { id: true } });
  if (taken) throw conflict("That email is already in use.", "EMAIL_TAKEN");
  const raw = randomToken();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      email: e,
      emailVerified: false,
      emailVerifyTokenHash: sha256(raw),
      emailVerifyExpires: new Date(Date.now() + 24 * 3600 * 1000),
    },
    select: meSelect,
  });
  await sendVerificationEmail(e, raw);
  return updated;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, keepSessionId: string | null) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw unauthorized("Current password is incorrect.", "BAD_PASSWORD");
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } }),
    prisma.refreshSession.deleteMany({ where: { userId, ...(keepSessionId ? { NOT: { id: keepSessionId } } : {}) } }),
  ]);
}

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw unauthorized("Password is incorrect.", "BAD_PASSWORD");
  // Keep circle counters honest before cascading deletes.
  const memberships = await prisma.circleMember.findMany({ where: { userId }, select: { circleId: true } });
  for (const m of memberships) {
    await prisma.circle.update({ where: { id: m.circleId }, data: { memberCount: { decrement: 1 } } }).catch(() => {});
  }
  await prisma.user.delete({ where: { id: userId } });
}

/** Everything a person has written, for data portability. */
export async function exportData(userId: string) {
  const [user, posts, comments, moods, reframes, sessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: meSelect }),
    prisma.post.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.comment.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.moodEntry.findMany({ where: { userId }, orderBy: { dayKey: "asc" } }),
    prisma.reframeEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.companionSession.findMany({ where: { userId }, include: { messages: { orderBy: { createdAt: "asc" } } } }),
  ]);
  return { exportedAt: new Date().toISOString(), user, posts, comments, moods, reframes, companionSessions: sessions };
}

export async function searchUsers(q: string, viewerId: string | null, cursor: string | undefined, limit: number) {
  const rows = await prisma.user.findMany({
    where: {
      isBanned: false,
      OR: [{ username: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }],
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { lastActiveAt: "desc" },
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, struggles: true },
  });
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  void viewerId;
  return { data, nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null, hasMore };
}
