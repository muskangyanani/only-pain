import type { AiFeature, Plan } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { paymentRequired } from "../lib/errors.js";
import { dayKey, msUntilUtcMidnight } from "../lib/dates.js";

export const DAILY_LIMITS: Record<Plan, Record<AiFeature, number>> = {
  FREE: { COMPANION: 15, REFRAME: 3, REPLY_HELPER: 10, REFLECTION: 0 },
  PLUS: { COMPANION: 300, REFRAME: 50, REPLY_HELPER: 100, REFLECTION: 7 },
};

export async function usageToday(userId: string) {
  const rows = await prisma.aiUsage.findMany({ where: { userId, dayKey: dayKey() }, select: { feature: true, count: true } });
  return Object.fromEntries(rows.map((r) => [r.feature, r.count])) as Partial<Record<AiFeature, number>>;
}

/** Throws 402 when the day's allowance for `feature` is used up; otherwise records one use. */
export async function consume(userId: string, plan: Plan, feature: AiFeature) {
  const limit = DAILY_LIMITS[plan][feature];
  const key = dayKey();
  const current = await prisma.aiUsage.findUnique({ where: { userId_dayKey_feature: { userId, dayKey: key, feature } } });
  const used = current?.count ?? 0;
  if (used >= limit) {
    throw paymentRequired(
      plan === "FREE"
        ? limit === 0
          ? "This one is part of Plus."
          : "You've used today's free allowance for this. It resets at midnight UTC — or Plus removes the wait."
        : "You've hit today's fair-use limit. It resets at midnight UTC.",
      "QUOTA_EXCEEDED",
      { feature, limit, used, resetsInMs: msUntilUtcMidnight(), upgradeAvailable: plan === "FREE" }
    );
  }
  await prisma.aiUsage.upsert({
    where: { userId_dayKey_feature: { userId, dayKey: key, feature } },
    create: { userId, dayKey: key, feature, count: 1 },
    update: { count: { increment: 1 } },
  });
  return { used: used + 1, limit };
}
