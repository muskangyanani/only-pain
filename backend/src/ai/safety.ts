import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { RiskLevel } from "@prisma/client";
import { getAnthropic, MODELS } from "./client.js";
import { SAFETY_SYSTEM } from "./prompts.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import type { CrisisLevel } from "../lib/crisis.js";

export type SafetyResult = {
  risk: RiskLevel;
  harmful: boolean;
  contentWarning: string | null;
  rationale: string;
  source: "ai" | "keywords" | "off";
};

const Schema = z.object({
  risk: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]),
  harmful: z.boolean(),
  contentWarning: z.enum(["self-harm", "suicidal-thoughts", "abuse", "eating", "substance-use", "loss"]).nullable(),
  rationale: z.string(),
});

function fromKeywords(prescreen: CrisisLevel): SafetyResult {
  return {
    risk: prescreen === "HIGH" ? "HIGH" : prescreen === "MEDIUM" ? "MEDIUM" : "NONE",
    harmful: false,
    contentWarning: prescreen === "HIGH" ? "suicidal-thoughts" : null,
    rationale: prescreen === "NONE" ? "No crisis keywords." : "Crisis keywords matched (keyword mode).",
    source: "keywords",
  };
}

/**
 * Classify user text for author risk + harmfulness. Falls back to the keyword
 * pre-screen when AI is unavailable, so safety never silently switches off.
 */
export async function classifyContent(text: string, kind: "post" | "comment" | "message", prescreen: CrisisLevel): Promise<SafetyResult> {
  if (env.AI_SAFETY_MODE === "off") return { ...fromKeywords("NONE"), source: "off" };
  const client = getAnthropic();
  if (env.AI_SAFETY_MODE === "keywords" || !client) return fromKeywords(prescreen);

  try {
    const response = await client.messages.parse({
      model: MODELS.classifier,
      max_tokens: 400,
      system: [{ type: "text", text: SAFETY_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Content type: ${kind}\nKeyword pre-screen: ${prescreen}\n\n<text>\n${text}\n</text>`,
        },
      ],
      output_config: { format: zodOutputFormat(Schema) },
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return fromKeywords(prescreen);
    const out = response.parsed_output;
    // Never let the model downgrade an explicit HIGH keyword hit below MEDIUM.
    const risk: RiskLevel = prescreen === "HIGH" && out.risk === "NONE" ? "MEDIUM" : out.risk;
    return { risk, harmful: out.harmful, contentWarning: out.contentWarning, rationale: out.rationale, source: "ai" };
  } catch (err) {
    logger.warn({ err }, "safety classifier failed; using keyword result");
    return fromKeywords(prescreen);
  }
}
