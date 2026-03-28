import { prisma } from "../lib/prisma.js";
import { stripAnonymous } from "../lib/anonymize.js";

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
};

export async function createComment(
  postId: string,
  authorId: string,
  data: {
    content: string;
    isAnonymous: boolean;
    parentCommentId?: string | null;
  }
) {
  let parentId = data.parentCommentId ?? null;

  // Enforce 2-level max nesting: if parent already has a parent, flatten
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { parentCommentId: true },
    });
    if (parent?.parentCommentId) {
      parentId = parent.parentCommentId;
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId,
      content: data.content,
      isAnonymous: data.isAnonymous,
      parentCommentId: parentId,
    },
    include: {
      author: { select: authorSelect },
    },
  });

  return stripAnonymous(comment);
}

export async function getComments(
  postId: string,
  cursor: string | undefined,
  limit: number = 20
) {
  // Get top-level comments
  const comments = await prisma.comment.findMany({
    where: { postId, parentCommentId: null },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: authorSelect },
    },
  });

  const hasMore = comments.length > limit;
  if (hasMore) comments.pop();

  // Get replies for these comments
  const commentIds = comments.map((c) => c.id);
  const replies = await prisma.comment.findMany({
    where: { parentCommentId: { in: commentIds } },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: authorSelect },
    },
  });

  const repliesByParent = new Map<string, typeof replies>();
  for (const reply of replies) {
    const parentId = reply.parentCommentId!;
    if (!repliesByParent.has(parentId)) {
      repliesByParent.set(parentId, []);
    }
    repliesByParent.get(parentId)!.push(reply);
  }

  const data = comments.map((comment) => ({
    ...stripAnonymous(comment),
    replies: (repliesByParent.get(comment.id) || []).map(stripAnonymous),
  }));

  return {
    data,
    nextCursor: comments.at(-1)?.id ?? null,
    hasMore,
  };
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Not authorized");

  await prisma.comment.delete({ where: { id: commentId } });
  return { message: "Comment deleted" };
}
