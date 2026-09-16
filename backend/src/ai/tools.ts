import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, MODELS } from "./client.js";
import { REFLECTION_SYSTEM, REFRAME_SYSTEM, REPLY_SYSTEM } from "./prompts.js";
import { logger } from "../lib/logger.js";
import { badRequest } from "../lib/errors.js";

// ---------- Untangle (reframe) ----------

export const ReframeSchema = z.object({
  validation: z.string(),
  patterns: z.array(z.object({ name: z.string(), how: z.string() })).min(1).max(3),
  reframe: z.string(),
  tinyStep: z.string(),
});
export type Reframe = z.infer<typeof ReframeSchema>;

export async function reframeThought(thought: string): Promise<Reframe> {
  const client = getAnthropic();
  if (!client) return mockReframe(thought);
  try {
    const response = await client.messages.parse({
      model: MODELS.companion,
      max_tokens: 1200,
      system: [{ type: "text", text: REFRAME_SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "medium", format: zodOutputFormat(ReframeSchema) },
      messages: [{ role: "user", content: `The thought:\n"${thought}"` }],
    });
    if (!response.parsed_output) throw new Error("no parsed output");
    return response.parsed_output;
  } catch (err) {
    logger.error({ err }, "reframe failed");
    throw badRequest("Ember couldn't untangle that one right now. Try again in a moment.", "AI_UNAVAILABLE");
  }
}

function mockReframe(thought: string): Reframe {
  return {
    validation: `Of course this thought lands hard — when you're already running on empty, "${thought.slice(0, 40)}…" feels like the truth, not a thought.`,
    patterns: [
      { name: "all-or-nothing", how: "It sorts the whole situation into total success or total failure, with nothing in between." },
      { name: "mind-reading", how: "It assumes you already know what other people think of you." },
    ],
    reframe: "I'm having a rough stretch and my brain is narrating it as a verdict. Rough stretches end; verdicts aren't real. I can be struggling and still be someone worth being kind to.",
    tinyStep: "Drink a glass of water and text one person a single line — no explanation needed.",
  };
}

// ---------- Say something kind (reply helper) ----------

const ReplySchema = z.object({ replies: z.array(z.string()).length(3) });

export async function suggestReplies(postContent: string): Promise<string[]> {
  const client = getAnthropic();
  if (!client) {
    return [
      "I don't have the right words, but I read all of this and I'm sitting with you in it.",
      "That sounds exhausting to carry. No need to reply — just wanted you to know someone saw this.",
      "The part about feeling like you're behind everyone else hit me. If you want company while you figure out the next small step, I'm around.",
    ];
  }
  try {
    const response = await client.messages.parse({
      model: MODELS.companion,
      max_tokens: 600,
      system: [{ type: "text", text: REPLY_SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low", format: zodOutputFormat(ReplySchema) },
      messages: [{ role: "user", content: `The post:\n"${postContent}"` }],
    });
    if (!response.parsed_output) throw new Error("no parsed output");
    return response.parsed_output.replies;
  } catch (err) {
    logger.error({ err }, "reply helper failed");
    throw badRequest("Couldn't think of anything just now — try again in a moment.", "AI_UNAVAILABLE");
  }
}

// ---------- Weekly reflection ----------

export const ReflectionSchema = z.object({
  headline: z.string(),
  observations: z.array(z.string()).min(1).max(4),
  gentleSuggestion: z.string(),
  affirmation: z.string(),
});
export type Reflection = z.infer<typeof ReflectionSchema>;

export type ReflectionInput = {
  moods: { dayKey: string; score: number; feelings: string[]; note: string | null }[];
  posts: { createdAt: string; content: string; tags: string[] }[];
  displayName?: string | null;
};

export async function weeklyReflection(input: ReflectionInput): Promise<Reflection> {
  const client = getAnthropic();
  if (!client) {
    return {
      headline: "A week with real weather in it — you kept showing up.",
      observations: [
        `You checked in ${input.moods.length} time${input.moods.length === 1 ? "" : "s"} this week; the mornings after low days tended to lift by a point.`,
        "Tired and overwhelmed showed up most, usually together — the two seem to travel as a pair for you.",
        "The day you wrote about the small win was also your highest score. Noticing that isn't nothing.",
      ],
      gentleSuggestion: "Try one 10-minute walk before checking your phone on two mornings this week, and see whether the tired/overwhelmed pair loosens.",
      affirmation: "You're allowed to be a work in progress and still be enough tonight.",
    };
  }
  const moodLines = input.moods.map((m) => `${m.dayKey}: ${m.score}/5 — ${m.feelings.join(", ") || "no feelings tagged"}${m.note ? ` — "${m.note}"` : ""}`).join("\n") || "(no check-ins)";
  const postLines = input.posts.map((p) => `${p.createdAt.slice(0, 10)} [${p.tags.join(", ")}]: ${p.content.slice(0, 300)}`).join("\n") || "(no posts)";
  try {
    const response = await client.messages.parse({
      model: MODELS.companion,
      max_tokens: 1200,
      system: [{ type: "text", text: REFLECTION_SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "medium", format: zodOutputFormat(ReflectionSchema) },
      messages: [
        {
          role: "user",
          content: `${input.displayName ? `Member name: ${input.displayName}\n` : ""}Mood check-ins this week (1 = awful, 5 = good):\n${moodLines}\n\nWhat they wrote this week:\n${postLines}`,
        },
      ],
    });
    if (!response.parsed_output) throw new Error("no parsed output");
    return response.parsed_output;
  } catch (err) {
    logger.error({ err }, "reflection failed");
    throw badRequest("Ember couldn't write your reflection right now. Try again in a moment.", "AI_UNAVAILABLE");
  }
}
