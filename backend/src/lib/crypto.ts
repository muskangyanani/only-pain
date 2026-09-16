import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const sha256 = (input: string) => createHash("sha256").update(input).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("hex");

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
