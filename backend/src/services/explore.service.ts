import { prisma } from "../lib/prisma.js";
import { stripAnonymous } from "../lib/anonymize.js";

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

export async function searchPosts(
  query: string,
  cursor: string | undefined,
  limit: number = 10
) {
  const posts = await prisma.post.findMany({
    where: {
      content: { contains: query, mode: "insensitive" },
    },
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
    data: posts.map((p) => ({ ...stripAnonymous(p), hasReacted: false })),
    nextCursor: posts.at(-1)?.id ?? null,
    hasMore,
  };
}

export async function searchUsers(
  query: string,
  cursor: string | undefined,
  limit: number = 10
) {
  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  const hasMore = users.length > limit;
  if (hasMore) users.pop();

  return {
    data: users,
    nextCursor: users.at(-1)?.id ?? null,
    hasMore,
  };
}

export async function getPostsByTag(
  tag: string,
  cursor: string | undefined,
  limit: number = 10
) {
  const posts = await prisma.post.findMany({
    where: { tags: { has: tag } },
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
    data: posts.map((p) => ({ ...stripAnonymous(p), hasReacted: false })),
    nextCursor: posts.at(-1)?.id ?? null,
    hasMore,
  };
}
