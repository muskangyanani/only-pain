/** YYYY-MM-DD in UTC. Clients send their local dayKey for mood check-ins. */
export function dayKey(d: Date = new Date()) {
  return d.toISOString().slice(0, 10);
}

export const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** ISO-8601 week key, e.g. 2026-W38. */
export function weekKey(d: Date = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
export const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000);

/** Milliseconds until next UTC midnight (used for quota reset hints). */
export function msUntilUtcMidnight(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}
