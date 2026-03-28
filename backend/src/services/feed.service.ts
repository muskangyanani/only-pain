import { prisma } from "../lib/prisma.js";
import { stripAnonymous } from "../lib/anonymize.js";

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

export async function getHomeFeed(
  cursor: string | undefined,
  limit: number = 10,
  currentUserId: string | null
) {
  const posts = await prisma.post.findMany({
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

  // Check reactions for current user
  let reactedPostIds = new Set<string>();
  if (currentUserId && posts.length > 0) {
    const reactions = await prisma.reaction.findMany({
      where: {
        userId: currentUserId,
        postId: { in: posts.map((p) => p.id) },
      },
      select: { postId: true },
    });
    reactedPostIds = new Set(reactions.map((r) => r.postId));
  }

  const data = posts.map((post) => ({
    ...stripAnonymous(post),
    hasReacted: reactedPostIds.has(post.id),
  }));

  return {
    data,
    nextCursor: posts.at(-1)?.id ?? null,
    hasMore,
  };
}
