import type { Prisma, ReactionType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { stripAnonymous } from "../lib/anonymize.js";
import { cursorArgs, paginate } from "../lib/pagination.js";
import { forbidden, notFound } from "../lib/errors.js";
import { scanCrisis } from "../lib/crisis.js";
import { REACTIONS } from "../lib/constants.js";
import { daysAgo } from "../lib/dates.js";
import { moderatePost } from "./moderation.service.js";

import { authorSelect, circleSelect } from "../lib/selects.js";
export { authorSelect, circleSelect };

export const postInclude = {
  author: { select: authorSelect },
  circle: { select: circleSelect },
} as const;

export type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export type ReactionCounts = Record<ReactionType, number>;

const emptyCounts = (): ReactionCounts =>
  Object.fromEntries(REACTIONS.map((r) => [r, 0])) as ReactionCounts;

/** Users hidden from `viewerId` in either direction of a block. */
export async function blockedUserIds(viewerId: string | null): Promise<string[]> {
  if (!viewerId) return [];
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) ids.add(b.blockerId === viewerId ? b.blockedId : b.blockerId);
  return [...ids];
}

/** Adds viewer-specific fields and strips anonymous identities. */
export async function decoratePosts(posts: PostRow[], viewerId: string | null) {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);
  const [grouped, mine, bookmarks] = await Promise.all([
    prisma.reaction.groupBy({ by: ["postId", "type"], where: { postId: { in: ids } }, _count: { _all: true } }),
    viewerId
      ? prisma.reaction.findMany({ where: { userId: viewerId, postId: { in: ids } }, select: { postId: true, type: true } })
      : Promise.resolve([]),
    viewerId
      ? prisma.bookmark.findMany({ where: { userId: viewerId, postId: { in: ids } }, select: { postId: true } })
      : Promise.resolve([]),
  ]);

  const counts = new Map<string, ReactionCounts>();
  for (const g of grouped) {
    const c = counts.get(g.postId) ?? emptyCounts();
    c[g.type] = g._count._all;
    counts.set(g.postId, c);
  }
  const myReaction = new Map(mine.map((m) => [m.postId, m.type]));
  const bookmarked = new Set(bookmarks.map((b) => b.postId));

  return posts.map((post) => {
    const isMine = !!viewerId && post.authorId === viewerId;
    const reactions = counts.get(post.id) ?? emptyCounts();
    const base = {
      ...post,
      reactions,
      reactionCount: Object.values(reactions).reduce((a, b) => a + b, 0),
      myReaction: myReaction.get(post.id) ?? null,
      isBookmarked: bookmarked.has(post.id),
      isMine,
    };
    return stripAnonymous(base, viewerId);
  });
}

export type DecoratedPost = Awaited<ReturnType<typeof decoratePosts>>[number];

const visibleWhere = (blocked: string[]): Prisma.PostWhereInput => ({
  moderation: "VISIBLE",
  ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
});

async function pageOf(where: Prisma.PostWhereInput, cursor: string | undefined, limit: number, viewerId: string | null) {
  const rows = await prisma.post.findMany({
    where,
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  const page = paginate(rows, limit);
  return { ...page, data: await decoratePosts(page.data, viewerId) };
}

export async function createPost(
  authorId: string,
  input: { content: string; tags: string[]; isAnonymous: boolean; circleId?: string | null; contentWarning?: string | null; imageUrl?: string | null }
) {
  if (input.circleId) {
    const member = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: input.circleId, userId: authorId } },
      select: { id: true },
    });
    if (!member) throw forbidden("Join the circle before posting in it.", "NOT_A_MEMBER");
  }
  const crisis = scanCrisis(input.content);
  const post = await prisma.post.create({
    data: {
      authorId,
      content: input.content,
      tags: input.tags,
      isAnonymous: input.isAnonymous,
      circleId: input.circleId ?? null,
      contentWarning: input.contentWarning ?? null,
      imageUrl: input.imageUrl ?? null,
      riskLevel: crisis.level === "HIGH" ? "HIGH" : crisis.level === "MEDIUM" ? "MEDIUM" : "NONE",
    },
    include: postInclude,
  });
  if (input.circleId) {
    prisma.circle.update({ where: { id: input.circleId }, data: { postCount: { increment: 1 } } }).catch(() => {});
  }
  // Never blocks posting. Runs the AI safety pass in the background.
  void moderatePost(post.id, post.content, authorId, crisis.level);

  const [decorated] = await decoratePosts([post], authorId);
  return { post: decorated!, safety: { showResources: crisis.level !== "NONE", level: crisis.level } };
}

export async function getPost(postId: string, viewerId: string | null) {
  const post = await prisma.post.findUnique({ where: { id: postId }, include: postInclude });
  if (!post) throw notFound("Post");
  const isOwner = viewerId === post.authorId;
  if (post.moderation === "REMOVED" && !isOwner) throw notFound("Post");
  if (post.moderation === "HIDDEN" && !isOwner) {
    const viewer = viewerId ? await prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } }) : null;
    if (!viewer || viewer.role === "USER") throw notFound("Post");
  }
  if (viewerId) {
    const blocked = await blockedUserIds(viewerId);
    if (blocked.includes(post.authorId)) throw notFound("Post");
  }
  const [decorated] = await decoratePosts([post], viewerId);
  return decorated!;
}

export async function updatePost(postId: string, userId: string, input: { content: string; tags: string[]; contentWarning?: string | null }) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw notFound("Post");
  if (post.authorId !== userId) throw forbidden();
  const crisis = scanCrisis(input.content);
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { content: input.content, tags: input.tags, contentWarning: input.contentWarning ?? null, editedAt: new Date() },
    include: postInclude,
  });
  void moderatePost(postId, input.content, userId, crisis.level);
  const [decorated] = await decoratePosts([updated], userId);
  return decorated!;
}

export async function deletePost(postId: string, user: { id: string; role: string }) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, circleId: true } });
  if (!post) throw notFound("Post");
  if (post.authorId !== user.id && user.role === "USER") throw forbidden();
  await prisma.post.delete({ where: { id: postId } });
  if (post.circleId) {
    prisma.circle.update({ where: { id: post.circleId }, data: { postCount: { decrement: 1 } } }).catch(() => {});
  }
}

// ---------- Feeds ----------

export async function latestFeed(viewerId: string | null, cursor: string | undefined, limit: number) {
  const blocked = await blockedUserIds(viewerId);
  return pageOf(visibleWhere(blocked), cursor, limit, viewerId);
}

export async function followingFeed(viewerId: string, cursor: string | undefined, limit: number) {
  const follows = await prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } });
  const ids = follows.map((f) => f.followingId);
  if (ids.length === 0) return { data: [], nextCursor: null, hasMore: false };
  // Anonymous posts must never be attributable via a "following" feed.
  return pageOf({ moderation: "VISIBLE", isAnonymous: false, authorId: { in: ids } }, cursor, limit, viewerId);
}

/**
 * "For you": recent posts that overlap with what the viewer is carrying
 * (their struggles), the people they follow and the circles they're in —
 * ranked by warmth (reactions/comments) and freshness. Offset-paginated
 * over a bounded candidate window so ranking stays cheap and stable.
 */
export async function forYouFeed(viewerId: string, cursor: string | undefined, limit: number) {
  const offset = Math.max(0, Number(cursor) || 0);
  const [me, follows, memberships, blocked] = await Promise.all([
    prisma.user.findUnique({ where: { id: viewerId }, select: { struggles: true } }),
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
    prisma.circleMember.findMany({ where: { userId: viewerId }, select: { circleId: true } }),
    blockedUserIds(viewerId),
  ]);
  const struggles = me?.struggles ?? [];
  const followingIds = follows.map((f) => f.followingId);
  const circleIds = memberships.map((m) => m.circleId);

  const or: Prisma.PostWhereInput[] = [];
  if (struggles.length) or.push({ tags: { hasSome: struggles } });
  if (followingIds.length) or.push({ authorId: { in: followingIds }, isAnonymous: false });
  if (circleIds.length) or.push({ circleId: { in: circleIds } });

  const where: Prisma.PostWhereInput = {
    ...visibleWhere(blocked),
    createdAt: { gte: daysAgo(14) },
    ...(or.length ? { OR: or } : {}),
  };
  const candidates = await prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take: 300, include: postInclude });

  const now = Date.now();
  const scored = candidates
    .map((p) => {
      const ageHours = (now - p.createdAt.getTime()) / 3600000;
      const tagMatches = p.tags.filter((t) => struggles.includes(t)).length;
      // Your own fresh post stays visible at the top for a day, so posting never feels like shouting into a void.
      const ownFresh = p.authorId === viewerId && ageHours < 24 ? 40 : 0;
      const score =
        ownFresh +
        p.reactionCount * 2 +
        p.commentCount * 3 +
        tagMatches * 5 +
        (followingIds.includes(p.authorId) && !p.isAnonymous ? 6 : 0) +
        (p.circleId && circleIds.includes(p.circleId) ? 4 : 0) -
        ageHours / 6;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);

  const slice = scored.slice(offset, offset + limit).map((s) => s.p);
  const hasMore = offset + limit < scored.length;
  return { data: await decoratePosts(slice, viewerId), nextCursor: hasMore ? String(offset + limit) : null, hasMore };
}

export async function tagFeed(tag: string, viewerId: string | null, cursor: string | undefined, limit: number) {
  const blocked = await blockedUserIds(viewerId);
  return pageOf({ ...visibleWhere(blocked), tags: { has: tag } }, cursor, limit, viewerId);
}

export async function circleFeed(circleId: string, viewerId: string | null, cursor: string | undefined, limit: number) {
  const blocked = await blockedUserIds(viewerId);
  return pageOf({ ...visibleWhere(blocked), circleId }, cursor, limit, viewerId);
}

export async function userPosts(userId: string, viewerId: string | null, cursor: string | undefined, limit: number) {
  const isOwn = viewerId === userId;
  const where: Prisma.PostWhereInput = isOwn
    ? { authorId: userId, isAnonymous: false, moderation: { in: ["VISIBLE", "HIDDEN", "PENDING"] } }
    : { authorId: userId, isAnonymous: false, moderation: "VISIBLE" };
  return pageOf(where, cursor, limit, viewerId);
}

export async function myAnonymousPosts(userId: string, cursor: string | undefined, limit: number) {
  const rows = await prisma.post.findMany({
    where: { authorId: userId, isAnonymous: true, moderation: { not: "REMOVED" } },
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  const page = paginate(rows, limit);
  // Author viewing their own anonymous posts: identity is still stripped in the
  // payload (consistency), but isMine lets the UI show "you, anonymously".
  return { ...page, data: await decoratePosts(page.data, userId) };
}

export async function searchPosts(q: string, viewerId: string | null, cursor: string | undefined, limit: number) {
  const blocked = await blockedUserIds(viewerId);
  return pageOf({ ...visibleWhere(blocked), content: { contains: q, mode: "insensitive" } }, cursor, limit, viewerId);
}

// ---------- Bookmarks ----------

export async function toggleBookmark(userId: string, postId: string) {
  const existing = await prisma.bookmark.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw notFound("Post");
  await prisma.bookmark.create({ data: { userId, postId } });
  return { bookmarked: true };
}

export async function bookmarks(userId: string, cursor: string | undefined, limit: number) {
  const rows = await prisma.bookmark.findMany({
    where: { userId, post: { moderation: "VISIBLE" } },
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "desc" },
    include: { post: { include: postInclude } },
  });
  const page = paginate(rows, limit);
  return { ...page, data: await decoratePosts(page.data.map((r) => r.post), userId) };
}
