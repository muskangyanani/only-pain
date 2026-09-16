import { Hono } from "hono";
import { HELPLINES } from "../lib/crisis.js";
import { CONTENT_WARNINGS, FEELINGS, LIMITS, REACTIONS, STRUGGLES, TAGS } from "../lib/constants.js";
import { aiLive } from "../ai/client.js";
import { billingEnabled } from "../services/billing.service.js";
import { prisma } from "../lib/prisma.js";

const router = new Hono();

router.get("/health", async (c) => {
  let db = "ok";
  try {
    await prisma.$runCommandRaw({ ping: 1 });
  } catch {
    db = "down";
  }
  return c.json({ success: true, data: { status: db === "ok" ? "ok" : "degraded", db, ai: aiLive() ? "live" : "mock", billing: billingEnabled, time: new Date().toISOString() } }, db === "ok" ? 200 : 503);
});

router.get("/constants", (c) => c.json({ success: true, data: { tags: TAGS, struggles: STRUGGLES, contentWarnings: CONTENT_WARNINGS, reactions: REACTIONS, feelings: FEELINGS, limits: LIMITS, aiLive: aiLive(), billingEnabled } }));
router.get("/resources", (c) => c.json({ success: true, data: HELPLINES }));

export default router;
