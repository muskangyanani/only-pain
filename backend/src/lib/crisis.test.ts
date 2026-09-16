import { describe, it, expect } from "vitest";
import { scanCrisis } from "./crisis.js";
import { dayKey, weekKey } from "./dates.js";

describe("scanCrisis", () => {
  it("flags explicit intent as HIGH", () => {
    expect(scanCrisis("honestly I want to die tonight").level).toBe("HIGH");
  });
  it("flags hopelessness as MEDIUM", () => {
    expect(scanCrisis("I just can't go on like this").level).toBe("MEDIUM");
  });
  it("leaves ordinary venting alone", () => {
    expect(scanCrisis("work was brutal and I cried in the bathroom").level).toBe("NONE");
  });
});

describe("dates", () => {
  it("formats day keys in UTC", () => {
    expect(dayKey(new Date("2026-09-16T23:59:00Z"))).toBe("2026-09-16");
  });
  it("computes ISO week keys", () => {
    expect(weekKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-W01");
    expect(weekKey(new Date("2024-12-30T00:00:00Z"))).toBe("2025-W01");
  });
});
