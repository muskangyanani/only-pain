import type { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { consume, usageToday, DAILY_LIMITS } from "../ai/quota.js";
import { reframeThought, suggestReplies, weeklyReflection, type Reflection } from "../ai/tools.js";
import { daysAgo, weekKey } from "../lib/dates.js";
import { notFound } from "../lib/errors.js";
import { aiLive } from "../ai/client.js";

export async function reframe(user: { id: string; plan: Plan }, thought: string) {
  await consume(user.id, user.plan, "REFRAME");
  const result = await reframeThought(thought);
  const entry = await prisma.reframeEntry.create({
    data: { userId: user.id, thought, validation: result.validation, patterns: result.patterns, reframe: result.reframe, tinyStep: result.tinyStep },
  });
  return entry;
}

export async function reframeHistory(userId: string) {
  return prisma.reframeEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 });
}

export async function deleteReframe(userId: string, id: string) {
  const res = await prisma.reframeEntry.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("Entry");
}

export async function replyIdeas(user: { id: string; plan: Plan }, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { content: true, moderation: true } });
  if (!post || post.moderation !== "VISIBLE") throw notFound("Post");
  await consume(user.id, user.plan, "REPLY_HELPER");
  return suggestReplies(post.content);
}

export async function reflection(user: { id: string; plan: Plan; displayName?: string | null }, force = false) {
  const key = weekKey();
  if (!force) {
    const cached = await prisma.weeklyReflection.findUnique({ where: { userId_weekKey: { userId: user.id, weekKey: key } } });
    if (cached) return { weekKey: key, content: cached.content as Reflection, createdAt: cached.createdAt, cached: true };
  }
  await consume(user.id, user.plan, "REFLECTION");
  const [moods, posts] = await Promise.all([
    prisma.moodEntry.findMany({ where: { userId: user.id, createdAt: { gte: daysAgo(7) } }, orderBy: { dayKey: "asc" } }),
    prisma.post.findMany({ where: { authorId: user.id, createdAt: { gte: daysAgo(7) } }, orderBy: { createdAt: "asc" }, take: 20 }),
  ]);
  const content = await weeklyReflection({
    displayName: user.displayName,
    moods: moods.map((m) => ({ dayKey: m.dayKey, score: m.score, feelings: m.feelings, note: m.note })),
    posts: posts.map((p) => ({ createdAt: p.createdAt.toISOString(), content: p.content, tags: p.tags })),
  });
  const saved = await prisma.weeklyReflection.upsert({
    where: { userId_weekKey: { userId: user.id, weekKey: key } },
    create: { userId: user.id, weekKey: key, content },
    update: { content, createdAt: new Date() },
  });
  return { weekKey: key, content, createdAt: saved.createdAt, cached: false };
}

export async function aiStatus(user: { id: string; plan: Plan }) {
  const used = await usageToday(user.id);
  return { live: aiLive(), plan: user.plan, limits: DAILY_LIMITS[user.plan], used };
}
