import { prisma } from "../lib/prisma.js";

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error("Cannot follow yourself");
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return { following: false };
  }

  await prisma.follow.create({ data: { followerId, followingId } });
  return { following: true };
}

export async function getFollowers(
  userId: string,
  cursor: string | undefined,
  limit: number = 20
) {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      follower: {
        select: { id: true, username: true, avatarUrl: true, bio: true },
      },
    },
  });

  const hasMore = follows.length > limit;
  if (hasMore) follows.pop();

  return {
    data: follows.map((f) => f.follower),
    nextCursor: follows.at(-1)?.id ?? null,
    hasMore,
  };
}

export async function getFollowing(
  userId: string,
  cursor: string | undefined,
  limit: number = 20
) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      following: {
        select: { id: true, username: true, avatarUrl: true, bio: true },
      },
    },
  });

  const hasMore = follows.length > limit;
  if (hasMore) follows.pop();

  return {
    data: follows.map((f) => f.following),
    nextCursor: follows.at(-1)?.id ?? null,
    hasMore,
  };
}
