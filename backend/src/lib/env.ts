import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  CLIENT_URL: z.url(),
  ANTHROPIC_API_KEY: z.string().default(""),
  AI_MODEL_COMPANION: z.string().default("claude-opus-5"),
  AI_MODEL_CLASSIFIER: z.string().default("claude-haiku-4-5"),
  AI_SAFETY_MODE: z.enum(["full", "keywords", "off"]).default("full"),
  REDIS_URL: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("only pain <hello@onlypain.app>"),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STRIPE_PRICE_PLUS_MONTHLY: z.string().default(""),
  ADMIN_EMAILS: z.string().default(""),
  RATE_LIMIT_DISABLED: z.string().default(""),
  LOG_LEVEL: z.string().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  // eslint-disable-next-line no-console
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const adminEmails = new Set(
  env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
);
