import { describe, it, expect } from "vitest";
import { stripAnonymous, ANONYMOUS_AUTHOR } from "./anonymize.js";

describe("stripAnonymous", () => {
  const post = { id: "p1", isAnonymous: true, authorId: "u1", author: { id: "u1", username: "riya", avatarUrl: null }, content: "x" };

  it("removes identity from anonymous items", () => {
    const out = stripAnonymous(post, null);
    expect(out.authorId).toBeNull();
    expect(out.author).toEqual(ANONYMOUS_AUTHOR);
    expect(JSON.stringify(out)).not.toContain("riya");
  });

  it("marks the author's own anonymous item as isMine without leaking identity", () => {
    const out = stripAnonymous(post, "u1") as typeof post & { isMine: boolean };
    expect(out.isMine).toBe(true);
    expect(out.authorId).toBeNull();
  });

  it("leaves public items untouched", () => {
    const pub = { ...post, isAnonymous: false };
    expect(stripAnonymous(pub, null)).toBe(pub);
  });
});
