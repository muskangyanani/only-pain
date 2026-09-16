import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
import { cursorArgs, paginate } from "../lib/pagination.js";
import { notify } from "./notification.service.js";
import { authorSelect } from "../lib/selects.js";

const personSelect = { ...authorSelect, bio: true, struggles: true } as const;

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) throw badRequest("You can't follow yourself.");
  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) throw notFound("User");
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: followerId, blockedId: followingId }, { blockerId: followingId, blockedId: followerId }] },
  });
  if (blocked) throw badRequest("You can't follow this person.", "BLOCKED");

  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return { following: false };
  }
  await prisma.follow.create({ data: { followerId, followingId } });
  void notify({ userId: followingId, type: "FOLLOW", actorId: followerId });
  return { following: true };
}

export async function followers(userId: string, cursor: string | undefined, limit: number) {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "desc" },
    include: { follower: { select: personSelect } },
  });
  const page = paginate(rows, limit);
  return { ...page, data: page.data.map((r) => r.follower) };
}

export async function following(userId: string, cursor: string | undefined, limit: number) {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    ...cursorArgs(cursor, limit),
    orderBy: { createdAt: "desc" },
    include: { following: { select: personSelect } },
  });
  const page = paginate(rows, limit);
  return { ...page, data: page.data.map((r) => r.following) };
}

export async function toggleBlock(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw badRequest("You can't block yourself.");
  const existing = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId, blockedId } } });
  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return { blocked: false };
  }
  await prisma.$transaction([
    prisma.block.create({ data: { blockerId, blockedId } }),
    prisma.follow.deleteMany({
      where: { OR: [{ followerId: blockerId, followingId: blockedId }, { followerId: blockedId, followingId: blockerId }] },
    }),
  ]);
  return { blocked: true };
}

export async function blockedUsers(userId: string) {
  const rows = await prisma.block.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    include: { blocked: { select: authorSelect } },
  });
  return rows.map((r) => ({ ...r.blocked, blockedAt: r.createdAt }));
}
