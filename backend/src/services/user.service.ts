import { prisma } from "../lib/prisma.js";
import { stripAnonymous } from "../lib/anonymize.js";

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

export async function getProfile(username: string, currentUserId: string | null) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          posts: { where: { isAnonymous: false } },
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  return {
    ...user,
    isFollowing,
    isOwnProfile: currentUserId === user.id,
  };
}

export async function getUserPosts(
  username: string,
  cursor: string | undefined,
  limit: number = 10
) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) throw new Error("User not found");

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, isAnonymous: false },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  return {
    data: posts.map((p) => ({ ...p, hasReacted: false })),
    nextCursor: posts.at(-1)?.id ?? null,
    hasMore,
  };
}

export async function getMyAnonymousPosts(
  userId: string,
  cursor: string | undefined,
  limit: number = 10
) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId, isAnonymous: true },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  // Don't strip anonymous since this is the author viewing their own posts
  return {
    data: posts.map((p) => ({ ...p, hasReacted: false })),
    nextCursor: posts.at(-1)?.id ?? null,
    hasMore,
  };
}
