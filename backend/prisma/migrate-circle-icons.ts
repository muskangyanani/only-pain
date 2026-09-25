/**
 * One-off: circles used to store a Unicode emoji; they now store an icon key.
 * Sets `icon` on every circle from its old `emoji` (leaves `emoji` in place so an
 * older API build keeps working until it is replaced).
 *
 *   DATABASE_URL=… node --import tsx prisma/migrate-circle-icons.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MAP: Record<string, string> = {
  "🌙": "moon", "🔥": "flame", "🕯️": "candle", "🕯": "candle", "🌊": "wave", "🌱": "sprout", "🧠": "brain", "🫂": "together", "✨": "sparkle",
  "☕": "coffee", "🌧️": "rain", "🪴": "leaf", "🧸": "teddy", "🎧": "headphones", "📓": "notebook", "🕊️": "feather", "🫧": "bubbles",
};

const updates = Object.entries(MAP).map(([emoji, icon]) => ({ q: { emoji, icon: { $exists: false } }, u: { $set: { icon } }, multi: true }));
updates.push({ q: { icon: { $exists: false } }, u: { $set: { icon: "together" } }, multi: true });

const res = (await prisma.$runCommandRaw({ update: "Circle", updates })) as { n?: number; nModified?: number };
console.log(`circles matched: ${res.n ?? 0}, updated: ${res.nModified ?? 0}`);
await prisma.$disconnect();
