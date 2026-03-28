export const CRISIS_KEYWORDS = [
  "kill myself",
  "end my life",
  "want to die",
  "suicide",
  "suicidal",
  "don't want to exist",
  "dont want to exist",
  "self harm",
  "self-harm",
  "end it all",
  "no reason to live",
  "better off dead",
  "want to disappear",
  "can't go on",
  "cant go on",
  "not worth living",
  "take my own life",
];

export function detectCrisisKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}
