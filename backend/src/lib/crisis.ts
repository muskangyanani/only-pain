/**
 * Fast keyword pre-screen for crisis language. This never blocks anything —
 * it decides whether to surface resources immediately and whether the AI
 * classifier should treat the text with priority. The AI classifier
 * (src/ai/safety.ts) does the nuanced pass afterwards.
 */
const HIGH = [
  "kill myself",
  "killing myself",
  "end my life",
  "ending my life",
  "take my own life",
  "want to die",
  "wanna die",
  "wish i was dead",
  "wish i were dead",
  "better off dead",
  "suicide",
  "suicidal",
  "not worth living",
  "no reason to live",
  "planning to end it",
  "end it all",
  "going to hurt myself",
  "hurt myself",
  "cut myself",
  "cutting myself",
  "self harm",
  "self-harm",
  "overdose",
];

const MEDIUM = [
  "don't want to exist",
  "dont want to exist",
  "don't want to be here",
  "dont want to be here",
  "want to disappear",
  "can't go on",
  "cant go on",
  "can't do this anymore",
  "cant do this anymore",
  "no point anymore",
  "nothing matters",
  "hate myself",
  "everyone would be better without me",
  "tired of living",
  "give up on life",
];

export type CrisisLevel = "NONE" | "MEDIUM" | "HIGH";

export function scanCrisis(text: string): { level: CrisisLevel; matches: string[] } {
  const lower = text.toLowerCase();
  const high = HIGH.filter((k) => lower.includes(k));
  if (high.length) return { level: "HIGH", matches: high };
  const medium = MEDIUM.filter((k) => lower.includes(k));
  if (medium.length) return { level: "MEDIUM", matches: medium };
  return { level: "NONE", matches: [] };
}

/** Helplines shown in-app and referenced by the AI companion. */
export const HELPLINES = [
  { country: "IN", name: "Tele-MANAS (Govt. of India, 24/7)", contact: "14416", url: "https://telemanas.mohfw.gov.in" },
  { country: "IN", name: "iCall (TISS)", contact: "9152987821", url: "https://icallhelpline.org" },
  { country: "IN", name: "Vandrevala Foundation (24/7)", contact: "1860-2662-345", url: "https://www.vandrevalafoundation.com" },
  { country: "US", name: "988 Suicide & Crisis Lifeline", contact: "988", url: "https://988lifeline.org" },
  { country: "UK", name: "Samaritans", contact: "116 123", url: "https://www.samaritans.org" },
  { country: "INTL", name: "Find a helpline in your country", contact: "findahelpline.com", url: "https://findahelpline.com" },
] as const;
