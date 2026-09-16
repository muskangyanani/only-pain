// Same-origin API client. /api/* is rewritten to the backend (see next.config.ts),
// so auth cookies stay first-party. Override with NEXT_PUBLIC_API_URL for direct calls.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = "ERROR",
    public extra: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
  get isAuth() {
    return this.status === 401;
  }
  get isQuota() {
    return this.status === 402;
  }
}

type Envelope<T> = { success: true; data: T; [k: string]: unknown } | { success: false; error: string; code?: string; [k: string]: unknown };

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => setTimeout(() => (refreshing = null), 0));
  }
  return refreshing;
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<{ data: T; envelope: Record<string, unknown> }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), accept: "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && retry && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/refresh")) {
    if (await tryRefresh()) return request<T>(method, path, body, false);
  }
  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    json = null;
  }
  if (!res.ok || !json || !json.success) {
    const err = json && !json.success ? json : null;
    const { error, code, success: _s, ...extra } = (err ?? {}) as Record<string, unknown>;
    void _s;
    throw new ApiError(res.status, (error as string) || res.statusText || "Request failed", (code as string) || "ERROR", extra);
  }
  const { data, success: _ok, ...rest } = json;
  void _ok;
  return { data, envelope: rest };
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path).then((r) => r.data),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}).then((r) => r.data),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}).then((r) => r.data),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body).then((r) => r.data),
  /** Paginated endpoints: returns { data, nextCursor, hasMore }. */
  page: <T>(path: string) => request<T[]>("GET", path).then((r) => ({ data: r.data, nextCursor: (r.envelope.nextCursor as string | null) ?? null, hasMore: !!r.envelope.hasMore })),
  /** Endpoints that return extra top-level fields alongside data (e.g. `safety`). */
  raw: <T>(method: string, path: string, body?: unknown) => request<T>(method, path, body),
};

export function withCursor(path: string, cursor?: string | null, extra: Record<string, string | number | undefined> = {}) {
  const url = new URL(path, "http://x");
  if (cursor) url.searchParams.set("cursor", cursor);
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  return url.pathname + url.search;
}

/** POST + consume a server-sent-event stream. Resolves when the stream ends. */
export async function streamSSE(
  path: string,
  body: unknown,
  handlers: { onEvent: (event: string, data: Record<string, unknown>) => void; signal?: AbortSignal }
) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: handlers.signal,
  });
  if (!res.ok || !res.body) {
    let json: Record<string, unknown> = {};
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {}
    const { error, code, ...extra } = json;
    throw new ApiError(res.status, (error as string) || "Stream failed", (code as string) || "ERROR", extra);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let event = "message";
      const dataLines: string[] = [];
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (dataLines.length) {
        try {
          handlers.onEvent(event, JSON.parse(dataLines.join("\n")));
        } catch {}
      }
    }
  }
}
