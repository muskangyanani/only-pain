import { prisma } from "../lib/prisma.js";

export async function toggleReaction(postId: string, userId: string) {
  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { postId, userId } });
  }

  const count = await prisma.reaction.count({ where: { postId } });

  return { reacted: !existing, count };
}
