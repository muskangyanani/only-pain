import { describe, it, expect } from "vitest";
import { Client, signup, useFreshDb } from "../test/helpers.js";

useFreshDb();

describe("posts, feeds, reactions, comments", () => {
  it("never exposes the author of an anonymous post, but tells the author it's theirs", async () => {
    const { client: author, user } = await signup({ username: "ghostwriter" });
    const created = await author.post("/api/posts", { content: "the 3am thoughts again", tags: ["insomnia"], isAnonymous: true });
    expect(created.status).toBe(201);
    expect(created.body.data.author.username).toBe("anonymous");
    expect(created.body.data.authorId).toBeNull();
    expect(created.body.data.isMine).toBe(true);
    const id = created.body.data.id as string;

    const { client: viewer } = await signup();
    const seen = await viewer.get(`/api/posts/${id}`);
    expect(seen.status).toBe(200);
    expect(JSON.stringify(seen.body)).not.toContain("ghostwriter");
    expect(JSON.stringify(seen.body)).not.toContain(user.id);
    expect(seen.body.data.isMine).toBe(false);

    const guest = await new Client().get("/api/feed?tab=latest");
    expect(guest.status).toBe(200);
    const inFeed = guest.body.data.find((p: { id: string }) => p.id === id);
    expect(inFeed.author.username).toBe("anonymous");

    // The author's public profile must not list it; their private anonymous tab must.
    const profilePosts = await viewer.get("/api/users/ghostwriter/posts");
    expect(profilePosts.body.data.map((p: { id: string }) => p.id)).not.toContain(id);
    const mine = await author.get("/api/users/me/anonymous-posts");
    expect(mine.body.data.map((p: { id: string }) => p.id)).toContain(id);
  });

  it("keeps anonymous posts out of the following feed", async () => {
    const { client: a, user: ua } = await signup();
    const { client: b } = await signup();
    await b.post(`/api/users/${ua.id}/follow`);
    const pub = await a.post("/api/posts", { content: "public and proud", tags: [] });
    const anon = await a.post("/api/posts", { content: "quiet and hidden", tags: [], isAnonymous: true });
    const feed = await b.get("/api/feed?tab=following");
    const ids = feed.body.data.map((p: { id: string }) => p.id);
    expect(ids).toContain(pub.body.data.id);
    expect(ids).not.toContain(anon.body.data.id);
  });

  it("surfaces crisis resources immediately when crisis language is used", async () => {
    const { client } = await signup();
    const res = await client.post("/api/posts", { content: "I want to die and I don't know who to tell", tags: ["depression"] });
    expect(res.status).toBe(201);
    expect(res.body.safety.showResources).toBe(true);
    expect(res.body.safety.level).toBe("HIGH");
  });

  it("validates content and tags", async () => {
    const { client } = await signup();
    expect((await client.post("/api/posts", { content: "   ", tags: [] })).status).toBe(400);
    expect((await client.post("/api/posts", { content: "x", tags: ["not-a-tag"] })).status).toBe(400);
    expect((await client.post("/api/posts", { content: "x", tags: ["anxiety", "grief", "burnout", "panic"] })).status).toBe(400);
  });

  it("sets, changes and clears reactions with live counts", async () => {
    const { client: a } = await signup();
    const { client: b } = await signup();
    const post = await a.post("/api/posts", { content: "reaction test", tags: [] });
    const id = post.body.data.id;
    let r = await b.post(`/api/posts/${id}/react`, { type: "HUG" });
    expect(r.body.data.myReaction).toBe("HUG");
    expect(r.body.data.reactions.HUG).toBe(1);
    r = await b.post(`/api/posts/${id}/react`, { type: "NOT_ALONE" });
    expect(r.body.data.myReaction).toBe("NOT_ALONE");
    expect(r.body.data.reactions.HUG).toBe(0);
    expect(r.body.data.reactionCount).toBe(1);
    r = await b.post(`/api/posts/${id}/react`, { type: "NOT_ALONE" });
    expect(r.body.data.myReaction).toBeNull();
    expect(r.body.data.reactionCount).toBe(0);
    const notifs = await a.get("/api/notifications");
    expect(notifs.body.data.some((n: { type: string }) => n.type === "REACTION")).toBe(true);
  });

  it("threads comments two levels deep and keeps counts honest", async () => {
    const { client: a } = await signup();
    const { client: b } = await signup();
    const post = await a.post("/api/posts", { content: "comment test", tags: [] });
    const id = post.body.data.id;
    const c1 = await b.post(`/api/posts/${id}/comments`, { content: "first", isAnonymous: true });
    expect(c1.status).toBe(201);
    expect(c1.body.data.author.username).toBe("anonymous");
    const c2 = await a.post(`/api/posts/${id}/comments`, { content: "reply", parentCommentId: c1.body.data.id });
    const c3 = await b.post(`/api/posts/${id}/comments`, { content: "reply to reply", parentCommentId: c2.body.data.id });
    expect(c3.body.data.parentCommentId).toBe(c1.body.data.id);
    const list = await a.get(`/api/posts/${id}/comments`);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].replies).toHaveLength(2);
    expect((await a.get(`/api/posts/${id}`)).body.data.commentCount).toBe(3);
    // deleting the parent removes its replies
    expect((await a.del(`/api/posts/comments/${c1.body.data.id}`)).status).toBe(403);
    expect((await b.del(`/api/posts/comments/${c1.body.data.id}`)).status).toBe(200);
    expect((await a.get(`/api/posts/${id}`)).body.data.commentCount).toBe(0);
  });

  it("only lets owners delete posts", async () => {
    const { client: a } = await signup();
    const { client: b } = await signup();
    const post = await a.post("/api/posts", { content: "mine", tags: [] });
    expect((await b.del(`/api/posts/${post.body.data.id}`)).status).toBe(403);
    expect((await a.del(`/api/posts/${post.body.data.id}`)).status).toBe(200);
    expect((await a.get(`/api/posts/${post.body.data.id}`)).status).toBe(404);
  });

  it("hides blocked users' posts from feeds", async () => {
    const { client: a, user: ua } = await signup();
    const { client: b } = await signup();
    const post = await a.post("/api/posts", { content: "you can't see me", tags: [] });
    await b.post(`/api/users/${ua.id}/block`);
    const feed = await b.get("/api/feed?tab=latest");
    expect(feed.body.data.map((p: { id: string }) => p.id)).not.toContain(post.body.data.id);
  });

  it("bookmarks and lists them", async () => {
    const { client: a } = await signup();
    const post = await a.post("/api/posts", { content: "keep this", tags: [] });
    expect((await a.post(`/api/posts/${post.body.data.id}/bookmark`)).body.data.bookmarked).toBe(true);
    const list = await a.get("/api/users/me/bookmarks");
    expect(list.body.data[0].isBookmarked).toBe(true);
  });
});
