import { describe, it, expect } from "vitest";
import { signup, useFreshDb } from "../test/helpers.js";

useFreshDb();

describe("circles", () => {
  it("creates a circle with the creator as owner and gates posting on membership", async () => {
    const { client: owner } = await signup();
    const { client: other } = await signup();
    const created = await owner.post("/api/circles", { name: "Night Shift", tagline: "for the 3am people", tags: ["insomnia"] });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe("night-shift");
    expect(created.body.data.myRole).toBe("OWNER");

    const blocked = await other.post("/api/posts", { content: "sneaking in", tags: [], circleId: created.body.data.id });
    expect(blocked.status).toBe(403);
    expect((await other.post("/api/circles/night-shift/join")).body.data.joined).toBe(true);
    const ok = await other.post("/api/posts", { content: "hello night", tags: [], circleId: created.body.data.id });
    expect(ok.status).toBe(201);
    const circle = await other.get("/api/circles/night-shift");
    expect(circle.body.data.memberCount).toBe(2);
    expect(circle.body.data.isMember).toBe(true);
    const posts = await other.get("/api/circles/night-shift/posts");
    expect(posts.body.data).toHaveLength(1);
    expect((await other.post("/api/circles/night-shift/leave")).body.data.joined).toBe(false);
    expect((await owner.post("/api/circles/night-shift/leave")).status).toBe(403);
  });
});

describe("direct messages", () => {
  it("runs the request → accept → chat flow", async () => {
    const { client: a } = await signup();
    const { client: b, user: ub } = await signup();
    const start = await a.post("/api/dm/conversations", { userId: ub.id, content: "hi, your post helped" });
    expect(start.status).toBe(201);
    expect(start.body.data.conversation.status).toBe("PENDING");
    const id = start.body.data.conversation.id;

    expect((await a.post(`/api/dm/conversations/${id}/messages`, { content: "one more" })).status).toBe(403);
    const requests = await b.get("/api/dm/conversations?filter=requests");
    expect(requests.body.data).toHaveLength(1);
    expect((await b.get("/api/dm/unread")).body.data.requests).toBe(1);

    const accepted = await b.post(`/api/dm/conversations/${id}/accept`);
    expect(accepted.body.data.status).toBe("ACCEPTED");
    expect((await a.post(`/api/dm/conversations/${id}/messages`, { content: "thank you for accepting" })).status).toBe(201);
    const msgs = await b.get(`/api/dm/conversations/${id}/messages`);
    expect(msgs.body.data).toHaveLength(2);
    expect((await b.get("/api/dm/unread")).body.data.messages).toBe(1);
    await b.post(`/api/dm/conversations/${id}/read`);
    expect((await b.get("/api/dm/unread")).body.data.messages).toBe(0);
  });

  it("respects dm privacy settings", async () => {
    const { client: a } = await signup();
    const { client: b, user: ub } = await signup();
    await b.patch("/api/settings/profile", { dmPrivacy: "NOBODY" });
    expect((await a.post("/api/dm/conversations", { userId: ub.id, content: "hello?" })).status).toBe(403);
    await b.patch("/api/settings/profile", { dmPrivacy: "FOLLOWING" });
    expect((await a.post("/api/dm/conversations", { userId: ub.id, content: "hello?" })).status).toBe(403);
    const { user: ua } = { user: (await a.get("/api/auth/me")).body.data };
    await b.post(`/api/users/${ua.id}/follow`);
    expect((await a.post("/api/dm/conversations", { userId: ub.id, content: "hello!" })).status).toBe(201);
  });
});

describe("mood check-ins", () => {
  it("upserts today's check-in and computes a streak", async () => {
    const { client } = await signup();
    const today = new Date().toISOString().slice(0, 10);
    const first = await client.put("/api/mood/today", { dayKey: today, score: 2, feelings: ["tired", "anxious"], note: "rough" });
    expect(first.status).toBe(200);
    const second = await client.put("/api/mood/today", { dayKey: today, score: 4, feelings: ["hopeful"] });
    expect(second.body.data.score).toBe(4);
    const summary = await client.get("/api/mood/summary");
    expect(summary.body.data.streak).toBe(1);
    expect(summary.body.data.today.score).toBe(4);
    expect((await client.put("/api/mood/today", { dayKey: "2020-01-01", score: 3, feelings: [] })).status).toBe(400);
  });
});

describe("ai quotas & onboarding", () => {
  it("gates the weekly reflection behind Plus and reports quota status", async () => {
    const { client } = await signup();
    const status = await client.get("/api/tools/status");
    expect(status.body.data.plan).toBe("FREE");
    expect(status.body.data.live).toBe(false);
    const reflection = await client.get("/api/tools/reflection");
    expect(reflection.status).toBe(402);
    expect(reflection.body.code).toBe("QUOTA_EXCEEDED");
    expect(reflection.body.upgradeAvailable).toBe(true);
  });

  it("untangles a thought (mock provider) and saves it", async () => {
    const { client } = await signup();
    const res = await client.post("/api/tools/reframe", { thought: "everyone will see I'm faking it" });
    expect(res.status).toBe(201);
    expect(res.body.data.reframe).toBeTruthy();
    expect((await client.get("/api/tools/reframe")).body.data).toHaveLength(1);
  });

  it("completes onboarding and suggests people who share struggles", async () => {
    const { client: a } = await signup();
    const { client: b, user: ub } = await signup();
    await a.post("/api/settings/onboarding", { struggles: ["anxiety", "burnout"], displayName: "A" });
    await b.post("/api/settings/onboarding", { struggles: ["burnout", "grief"] });
    const people = await a.get("/api/explore/people");
    expect(people.body.data[0].id).toBe(ub.id);
    expect(people.body.data[0].sharedStruggles).toEqual(["burnout"]);
    const me = await a.get("/api/auth/me");
    expect(me.body.data.onboardedAt).toBeTruthy();
  });
});
