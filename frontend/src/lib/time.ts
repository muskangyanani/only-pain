export function timeAgo(input: string | Date, now = Date.now()) {
  const date = typeof input === "string" ? new Date(input) : input;
  const s = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}w`;
  if (d < 365) return `${Math.floor(d / 30)}mo`;
  return `${Math.floor(d / 365)}y`;
}

export function longDate(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function timeOfDay(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "still up";
  if (h < 12) return "good morning";
  if (h < 17) return "good afternoon";
  if (h < 21) return "good evening";
  return "late night";
}
