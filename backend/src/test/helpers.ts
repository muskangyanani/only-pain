import { beforeAll, afterAll } from "vitest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";

export async function resetDb() {
  const models = [
    prisma.report, prisma.notification, prisma.message, prisma.conversation, prisma.circleMember, prisma.circle,
    prisma.bookmark, prisma.reaction, prisma.comment, prisma.post, prisma.moodEntry, prisma.companionMessage,
    prisma.companionSession, prisma.reframeEntry, prisma.weeklyReflection, prisma.aiUsage, prisma.block,
    prisma.follow, prisma.refreshSession, prisma.user,
  ] as unknown as { deleteMany: () => Promise<unknown> }[];
  for (const m of models) await m.deleteMany();
}

/** Minimal HTTP client over app.request() with a cookie jar, like a browser. */
export class Client {
  private cookies = new Map<string, string>();

  private cookieHeader() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private storeCookies(res: Response) {
    for (const raw of res.headers.getSetCookie()) {
      const [pair, ...attrs] = raw.split(";");
      const [name, ...rest] = pair!.trim().split("=");
      const value = rest.join("=");
      const maxAge = attrs.map((a) => a.trim()).find((a) => a.toLowerCase().startsWith("max-age="));
      if (!value || (maxAge && Number(maxAge.split("=")[1]) <= 0)) this.cookies.delete(name!);
      else this.cookies.set(name!, value);
    }
  }

  async req<T = any>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await app.request(path, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(this.cookies.size ? { cookie: this.cookieHeader() } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    this.storeCookies(res);
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, body: json as T, headers: res.headers };
  }

  get = <T = any>(path: string) => this.req<T>("GET", path);
  post = <T = any>(path: string, body?: unknown) => this.req<T>("POST", path, body ?? {});
  patch = <T = any>(path: string, body?: unknown) => this.req<T>("PATCH", path, body ?? {});
  put = <T = any>(path: string, body?: unknown) => this.req<T>("PUT", path, body ?? {});
  del = <T = any>(path: string, body?: unknown) => this.req<T>("DELETE", path, body);
  hasCookie = (name: string) => this.cookies.has(name);
  clearCookies = () => this.cookies.clear();
}

let counter = 0;
export async function signup(overrides: Partial<{ username: string; email: string; password: string }> = {}) {
  counter += 1;
  const client = new Client();
  const username = overrides.username ?? `user${counter}_${Date.now().toString(36).slice(-4)}`;
  const res = await client.post("/api/auth/signup", {
    username,
    email: overrides.email ?? `${username}@example.com`,
    password: overrides.password ?? "password123",
  });
  if (res.status !== 201) throw new Error(`signup failed: ${JSON.stringify(res.body)}`);
  return { client, user: res.body.data as { id: string; username: string } };
}

export function useFreshDb() {
  beforeAll(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
}
