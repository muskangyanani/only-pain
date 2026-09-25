// Server-side only. Resolves the API origin used for the /api/* rewrite and for
// server-side metadata fetches. On Vercel, plain env vars are stored as "sensitive"
// (unreadable by local `vercel build`), so fall back to the public socket origin —
// it is the same server — before the local-dev default.
export function backendUrl() {
  const explicit = process.env.BACKEND_URL;
  if (explicit && explicit !== "[SENSITIVE]") return explicit.replace(/\/$/, "");
  const pub = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (pub) return pub.replace(/\/$/, "");
  return "http://localhost:4000";
}
