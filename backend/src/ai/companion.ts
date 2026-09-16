import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, MODELS } from "./client.js";
import { EMBER_SYSTEM } from "./prompts.js";
import { HELPLINES, type CrisisLevel } from "../lib/crisis.js";
import { logger } from "../lib/logger.js";

export type CompanionTurn = { role: "user" | "assistant"; content: string };

export type CompanionContext = {
  displayName?: string | null;
  struggles?: string[];
  crisis: CrisisLevel;
};

const MAX_HISTORY = 30;

function contextPreamble(ctx: CompanionContext) {
  const bits: string[] = [];
  if (ctx.displayName) bits.push(`They go by "${ctx.displayName}".`);
  if (ctx.struggles?.length) bits.push(`In onboarding they said they're carrying: ${ctx.struggles.join(", ")}.`);
  if (ctx.crisis !== "NONE") {
    bits.push(
      `Safety note: their latest message matched ${ctx.crisis === "HIGH" ? "high-risk" : "concerning"} crisis language. Slow down, check they're safe right now, and include a helpline naturally.`
    );
  }
  return bits.length ? `[Context for Ember — do not repeat verbatim]\n${bits.join("\n")}\n\n` : "";
}

/**
 * Streams Ember's reply as text chunks. Uses the beta messages surface so we
 * can opt into server-side refusal fallbacks (rare here, but harmless).
 */
export async function* streamCompanionReply(history: CompanionTurn[], userMessage: string, ctx: CompanionContext): AsyncGenerator<string> {
  const client = getAnthropic();
  if (!client) {
    yield* mockCompanionReply(userMessage, ctx);
    return;
  }

  const trimmed = history.slice(-MAX_HISTORY);
  const messages: Anthropic.Beta.BetaMessageParam[] = trimmed.map((t) => ({ role: t.role, content: t.content }));
  const preamble = contextPreamble(ctx);
  messages.push({ role: "user", content: preamble + userMessage });

  try {
    const stream = client.beta.messages.stream({
      model: MODELS.companion,
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: EMBER_SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "medium" },
      messages,
    });
    let emitted = false;
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        emitted = true;
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal" && !emitted) {
      yield "I want to stay with you on this, but I can't go where that question leads. I'm still here — tell me what's underneath it?";
    }
  } catch (err) {
    logger.error({ err }, "companion stream failed");
    yield "Something on my side just stumbled. I'm still here — want to try saying that again?";
  }
}

/** Offline stand-in used when no API key is configured. Intentionally simple and honest. */
async function* mockCompanionReply(userMessage: string, ctx: CompanionContext): AsyncGenerator<string> {
  const lower = userMessage.toLowerCase();
  let text: string;
  if (ctx.crisis !== "NONE") {
    const h = HELPLINES[0]!;
    text = `I'm really glad you told me that, and I'm not going anywhere. Before anything else — are you safe right now, in this moment? If it feels like too much to hold alone tonight, ${h.name} is free and open all hours at ${h.contact}. You can also just keep talking to me. What's the heaviest part right now?`;
  } else if (/hi|hello|hey/.test(lower) && lower.length < 20) {
    text = `Hey. Glad you're here. No agenda on my side — what's on your mind tonight?`;
  } else if (/tired|exhaust|burn/.test(lower)) {
    text = `That sounds like the kind of tired that sleep doesn't really fix. When everything asks something of you, even resting can feel like another task. What's been asking the most of you lately?`;
  } else if (/anxious|anxiety|panic|worry/.test(lower)) {
    text = `Anxiety has a way of making every possibility feel like a certainty. Let's slow it down for a second: breathe in for four, hold for four, out for six. Then tell me — what's the specific thing your brain is circling right now?`;
  } else if (/alone|lonely|nobody/.test(lower)) {
    text = `Loneliness is such a heavy thing to carry quietly. I'm here with you right now, and there are people in this place carrying the same weight. When did it start feeling this way?`;
  } else {
    text = `I hear you. That sounds genuinely hard, and it makes sense that it's weighing on you. I'm not going to rush to fix it — can you tell me a bit more about what that's been like for you?`;
  }
  const words = text.split(" ");
  for (let i = 0; i < words.length; i += 2) {
    yield words.slice(i, i + 2).join(" ") + (i + 2 < words.length ? " " : "");
    await new Promise((r) => setTimeout(r, 35));
  }
}
