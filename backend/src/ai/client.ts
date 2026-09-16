import Anthropic from "@anthropic-ai/sdk";
import { env } from "../lib/env.js";

let client: Anthropic | null | undefined;

/** Shared Anthropic client, or null when no API key is configured (mock mode). */
export function getAnthropic(): Anthropic | null {
  if (client !== undefined) return client;
  client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 60_000 }) : null;
  return client;
}

export const aiLive = () => !!env.ANTHROPIC_API_KEY;
export const MODELS = { companion: env.AI_MODEL_COMPANION, classifier: env.AI_MODEL_CLASSIFIER } as const;
