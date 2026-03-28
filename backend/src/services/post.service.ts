import { prisma } from "../lib/prisma.js";
import { stripAnonymous } from "../lib/anonymize.js";
import { scanForCrisisKeywords, flagPost } from "./crisis.service.js";

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

export async function createPost(
  authorId: string,
  data: {
    content: string;
    tags: string[];
    isAnonymous: boolean;
    imageUrl?: string | null;
  }
) {
  const post = await prisma.post.create({
    data: {
      authorId,
      content: data.content,
      tags: data.tags,
      isAnonymous: data.isAnonymous,
      imageUrl: data.imageUrl ?? null,
    },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  // Crisis detection — never block, just flag silently
  const crisis = scanForCrisisKeywords(data.content);
  if (crisis.flagged) {
    flagPost(post.id, crisis.keywords).catch(console.error);
  }

  return stripAnonymous(post);
}

export async function getPost(postId: string, currentUserId: string | null) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Check if current user has reacted
  let hasReacted = false;
  if (currentUserId) {
    const reaction = await prisma.reaction.findUnique({
      where: { postId_userId: { postId, userId: currentUserId } },
    });
    hasReacted = !!reaction;
  }

  return { ...stripAnonymous(post), hasReacted };
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.authorId !== userId) {
    throw new Error("Not authorized to delete this post");
  }

  await prisma.post.delete({ where: { id: postId } });
  return { message: "Post deleted" };
}

export async function getUserPosts(
  userId: string,
  cursor: string | undefined,
  limit: number = 10
) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId, isAnonymous: false },
    take: limit + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  return {
    data: posts.map(stripAnonymous),
    nextCursor: posts.at(-1)?.id ?? null,
    hasMore,
  };
}
