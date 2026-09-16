import Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { badRequest, notFound } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export const billingEnabled = !!(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PLUS_MONTHLY);
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export const PLUS_PRICE_LABEL = "₹199 / month";

function requireStripe() {
  if (!stripe || !billingEnabled) throw badRequest("Billing isn't configured on this server yet.", "BILLING_DISABLED");
  return stripe;
}

export async function status(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, planRenewsAt: true, stripeCustomerId: true },
  });
  if (!user) throw notFound("User");
  return {
    enabled: billingEnabled,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    renewsAt: user.planRenewsAt,
    hasCustomer: !!user.stripeCustomerId,
    priceLabel: PLUS_PRICE_LABEL,
  };
}

async function ensureCustomer(userId: string) {
  const s = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, username: true, stripeCustomerId: true } });
  if (!user) throw notFound("User");
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await s.customers.create({ email: user.email, name: user.username, metadata: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckout(userId: string) {
  const s = requireStripe();
  const customer = await ensureCustomer(userId);
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: env.STRIPE_PRICE_PLUS_MONTHLY, quantity: 1 }],
    success_url: `${env.CLIENT_URL}/plus?status=success`,
    cancel_url: `${env.CLIENT_URL}/plus?status=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: userId,
    subscription_data: { metadata: { userId } },
  });
  return { url: session.url };
}

export async function createPortal(userId: string) {
  const s = requireStripe();
  const customer = await ensureCustomer(userId);
  const session = await s.billingPortal.sessions.create({ customer, return_url: `${env.CLIENT_URL}/settings/billing` });
  return { url: session.url };
}

function mapStatus(status: Stripe.Subscription.Status): { plan: Plan; subscriptionStatus: SubscriptionStatus } {
  switch (status) {
    case "active":
      return { plan: "PLUS", subscriptionStatus: "ACTIVE" };
    case "trialing":
      return { plan: "PLUS", subscriptionStatus: "TRIALING" };
    case "past_due":
      return { plan: "PLUS", subscriptionStatus: "PAST_DUE" };
    case "incomplete":
    case "incomplete_expired":
      return { plan: "FREE", subscriptionStatus: "INCOMPLETE" };
    default:
      return { plan: "FREE", subscriptionStatus: "CANCELED" };
  }
}

async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await prisma.user.findFirst({
    where: { OR: [{ stripeCustomerId: customerId }, ...(sub.metadata?.userId ? [{ id: sub.metadata.userId }] : [])] },
    select: { id: true },
  });
  if (!user) {
    logger.warn({ customerId }, "stripe subscription for unknown customer");
    return;
  }
  const periodEnd =
    sub.items.data[0]?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...mapStatus(sub.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      planRenewsAt: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

export async function handleWebhook(rawBody: string, signature: string | undefined) {
  const s = requireStripe();
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) throw badRequest("Missing signature.");
  const event = await s.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await s.subscriptions.retrieve(subId);
        await applySubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscription(event.data.object);
      break;
    default:
      break;
  }
  return { received: true, type: event.type };
}
