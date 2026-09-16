import { prisma } from "../lib/prisma.js";
import { daysAgo } from "../lib/dates.js";
import { blockedUserIds } from "./post.service.js";
import { circleCard } from "./circle.service.js";

/**
 * "People who get it": others carrying similar things, ranked by overlap in
 * struggles and shared circles, with a nudge for people who are around.
 * Deterministic and explainable — the UI shows *why* someone is suggested.
 */
export async function peopleWhoGetIt(userId: string, limit = 8) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { struggles: true } });
  if (!me || me.struggles.length === 0) return [];
  const [follows, blocked, myCircles] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    blockedUserIds(userId),
    prisma.circleMember.findMany({ where: { userId }, select: { circleId: true } }),
  ]);
  const exclude = [userId, ...follows.map((f) => f.followingId), ...blocked];
  const candidates = await prisma.user.findMany({
    where: { id: { notIn: exclude }, isBanned: false, struggles: { hasSome: me.struggles } },
    orderBy: { lastActiveAt: "desc" },
    take: 80,
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, struggles: true, lastActiveAt: true, dmPrivacy: true },
  });
  if (candidates.length === 0) return [];
  const myCircleIds = new Set(myCircles.map((c) => c.circleId));
  const memberships = myCircleIds.size
    ? await prisma.circleMember.findMany({
        where: { userId: { in: candidates.map((c) => c.id) }, circleId: { in: [...myCircleIds] } },
        select: { userId: true, circleId: true },
      })
    : [];
  const sharedCircles = new Map<string, number>();
  for (const m of memberships) sharedCircles.set(m.userId, (sharedCircles.get(m.userId) ?? 0) + 1);
  const activeCutoff = daysAgo(7).getTime();

  return candidates
    .map((c) => {
      const shared = c.struggles.filter((s) => me.struggles.includes(s));
      const score = shared.length * 3 + (sharedCircles.get(c.id) ?? 0) * 2 + (c.lastActiveAt.getTime() > activeCutoff ? 2 : 0);
      return { ...c, sharedStruggles: shared, sharedCircles: sharedCircles.get(c.id) ?? 0, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function suggestedCircles(userId: string | null, limit = 6) {
  const me = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { struggles: true } }) : null;
  const memberOf = userId ? await prisma.circleMember.findMany({ where: { userId }, select: { circleId: true } }) : [];
  const circles = await prisma.circle.findMany({
    where: {
      id: { notIn: memberOf.map((m) => m.circleId) },
      ...(me?.struggles.length ? { tags: { hasSome: me.struggles } } : {}),
    },
    orderBy: [{ isOfficial: "desc" }, { memberCount: "desc" }],
    take: limit,
    select: circleCard,
  });
  return circles.map((c) => ({ ...c, isMember: false, matchingTags: c.tags.filter((t) => me?.struggles.includes(t)) }));
}
