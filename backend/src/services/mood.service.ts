import { prisma } from "../lib/prisma.js";
import { badRequest } from "../lib/errors.js";
import { DAY_KEY_RE, dayKey } from "../lib/dates.js";
import { FEELINGS } from "../lib/constants.js";

function assertRecentDayKey(key: string) {
  if (!DAY_KEY_RE.test(key)) throw badRequest("Invalid day.");
  const diff = Math.abs(new Date(`${key}T00:00:00Z`).getTime() - new Date(`${dayKey()}T00:00:00Z`).getTime());
  if (diff > 2 * 86400000) throw badRequest("Check-ins are for today (or yesterday).");
}

export async function checkIn(userId: string, input: { dayKey: string; score: number; feelings: string[]; note?: string | null }) {
  assertRecentDayKey(input.dayKey);
  const bad = input.feelings.filter((f) => !(FEELINGS as readonly string[]).includes(f));
  if (bad.length) throw badRequest(`Unknown feeling: ${bad[0]}`);
  return prisma.moodEntry.upsert({
    where: { userId_dayKey: { userId, dayKey: input.dayKey } },
    create: { userId, dayKey: input.dayKey, score: input.score, feelings: input.feelings, note: input.note ?? null },
    update: { score: input.score, feelings: input.feelings, note: input.note ?? null },
  });
}

export async function history(userId: string, days: number) {
  const since = new Date(Date.now() - days * 86400000);
  return prisma.moodEntry.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { dayKey: "asc" },
    select: { id: true, dayKey: true, score: true, feelings: true, note: true, createdAt: true },
  });
}

export async function summary(userId: string) {
  const entries = await prisma.moodEntry.findMany({
    where: { userId },
    orderBy: { dayKey: "desc" },
    take: 90,
    select: { dayKey: true, score: true, feelings: true },
  });
  const today = dayKey();
  const todayEntry = entries.find((e) => e.dayKey === today) ?? null;

  // Streak: consecutive days ending today or yesterday.
  let streak = 0;
  const set = new Set(entries.map((e) => e.dayKey));
  const cursor = new Date();
  if (!set.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const last7 = entries.slice(0, 7);
  const last30 = entries.slice(0, 30);
  const avg = (xs: { score: number }[]) => (xs.length ? xs.reduce((a, b) => a + b.score, 0) / xs.length : null);
  const feelingCounts = new Map<string, number>();
  for (const e of last30) for (const f of e.feelings) feelingCounts.set(f, (feelingCounts.get(f) ?? 0) + 1);
  const topFeelings = [...feelingCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f]) => f);

  return { today: todayEntry, streak, avg7: avg(last7), avg30: avg(last30), total: entries.length, topFeelings };
}
