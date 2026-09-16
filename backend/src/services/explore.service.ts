import { prisma } from "../lib/prisma.js";
import { daysAgo } from "../lib/dates.js";
import { TAGS } from "../lib/constants.js";

type TagCount = { _id: string; count: number };

/** Tag activity over the last 7 days (falls back to all-time when quiet). */
export async function trendingTags(limit = 8) {
  const pipeline = (since?: Date) => [
    { $match: { moderation: "VISIBLE", ...(since ? { createdAt: { $gte: { $date: since.toISOString() } } } : {}) } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ];
  let rows = (await prisma.post.aggregateRaw({ pipeline: pipeline(daysAgo(7)) })) as unknown as TagCount[];
  if (!rows.length) rows = (await prisma.post.aggregateRaw({ pipeline: pipeline() })) as unknown as TagCount[];
  return rows.filter((r) => (TAGS as readonly string[]).includes(r._id)).map((r) => ({ tag: r._id, count: r.count }));
}

export async function tagCounts() {
  const rows = (await prisma.post.aggregateRaw({
    pipeline: [{ $match: { moderation: "VISIBLE" } }, { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }],
  })) as unknown as TagCount[];
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return TAGS.map((tag) => ({ tag, count: map.get(tag) ?? 0 }));
}

export async function communityPulse() {
  const [posts24h, members, checkIns24h] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: daysAgo(1) }, moderation: "VISIBLE" } }),
    prisma.user.count({ where: { isBanned: false } }),
    prisma.moodEntry.count({ where: { updatedAt: { gte: daysAgo(1) } } }),
  ]);
  return { posts24h, members, checkIns24h };
}
