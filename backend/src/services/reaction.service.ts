import type { ReactionType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import { notify } from "./notification.service.js";
import { REACTIONS } from "../lib/constants.js";

export async function setReaction(postId: string, userId: string, type: ReactionType | null) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, moderation: true } });
  if (!post || post.moderation === "REMOVED") throw notFound("Post");

  const existing = await prisma.reaction.findUnique({ where: { postId_userId: { postId, userId } } });
  let myReaction: ReactionType | null = null;

  if (!type || (existing && existing.type === type)) {
    if (existing) await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId, type },
      update: { type },
    });
    myReaction = type;
    if (!existing) {
      void notify({ userId: post.authorId, type: "REACTION", actorId: userId, postId });
    }
  }

  const grouped = await prisma.reaction.groupBy({ by: ["type"], where: { postId }, _count: { _all: true } });
  const reactions = Object.fromEntries(REACTIONS.map((r) => [r, 0])) as Record<ReactionType, number>;
  for (const g of grouped) reactions[g.type] = g._count._all;
  const reactionCount = Object.values(reactions).reduce((a, b) => a + b, 0);
  await prisma.post.update({ where: { id: postId }, data: { reactionCount } });

  return { myReaction, reactions, reactionCount };
}
