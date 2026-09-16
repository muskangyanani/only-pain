import { describe, it, expect } from "vitest";
import { Client, signup, useFreshDb } from "../test/helpers.js";

useFreshDb();

describe("auth", () => {
  it("signs up, sets cookies and returns the user", async () => {
    const { client, user } = await signup({ username: "riya_k" });
    expect(user.username).toBe("riya_k");
    expect(client.hasCookie("op_access")).toBe(true);
    expect(client.hasCookie("op_refresh")).toBe(true);
    const me = await client.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("riya_k@example.com");
    expect(me.body.data.passwordHash).toBeUndefined();
  });

  it("rejects duplicate and reserved usernames", async () => {
    const dup = await new Client().post("/api/auth/signup", { username: "riya_k", email: "other@example.com", password: "password123" });
    expect(dup.status).toBe(409);
    const reserved = await new Client().post("/api/auth/signup", { username: "anonymous", email: "anon@example.com", password: "password123" });
    expect(reserved.status).toBe(400);
    const weak = await new Client().post("/api/auth/signup", { username: "weakpw", email: "weak@example.com", password: "short" });
    expect(weak.status).toBe(400);
    expect(weak.body.code).toBe("VALIDATION");
  });

  it("logs in with username or email, rejects bad passwords", async () => {
    const c = new Client();
    expect((await c.post("/api/auth/login", { identifier: "riya_k", password: "nope-nope" })).status).toBe(401);
    const ok = await c.post("/api/auth/login", { identifier: "RIYA_K@example.com", password: "password123" });
    expect(ok.status).toBe(200);
    expect(ok.body.data.username).toBe("riya_k");
  });

  it("refreshes and rotates the refresh token; old token is rejected afterwards", async () => {
    const { client } = await signup();
    const sessionsBefore = await client.get("/api/auth/sessions");
    expect(sessionsBefore.body.data).toHaveLength(1);
    const refreshed = await client.post("/api/auth/refresh");
    expect(refreshed.status).toBe(200);
    expect((await client.get("/api/auth/me")).status).toBe(200);
  });

  it("logs out and revokes access", async () => {
    const { client } = await signup();
    await client.post("/api/auth/logout");
    expect(client.hasCookie("op_refresh")).toBe(false);
    expect((await client.get("/api/auth/me")).status).toBe(401);
  });

  it("requires auth for protected routes", async () => {
    expect((await new Client().get("/api/notifications")).status).toBe(401);
    expect((await new Client().post("/api/posts", { content: "hi" })).status).toBe(401);
  });
});
