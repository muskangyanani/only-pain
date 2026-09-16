import { Hono } from "hono";
import * as billing from "../services/billing.service.js";
import { requireAuth } from "../middleware/auth.js";
import type { AppVariables } from "../types.js";

const router = new Hono<{ Variables: AppVariables }>();

router.get("/status", requireAuth, async (c) => c.json({ success: true, data: await billing.status(c.get("userId")!) }));
router.post("/checkout", requireAuth, async (c) => c.json({ success: true, data: await billing.createCheckout(c.get("userId")!) }));
router.post("/portal", requireAuth, async (c) => c.json({ success: true, data: await billing.createPortal(c.get("userId")!) }));

// Stripe posts raw JSON here; signature is verified against the raw body.
router.post("/webhook", async (c) => {
  const raw = await c.req.text();
  const result = await billing.handleWebhook(raw, c.req.header("stripe-signature"));
  return c.json({ success: true, data: result });
});

export default router;
