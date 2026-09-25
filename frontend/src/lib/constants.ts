// Mirrors backend/src/lib/constants.ts plus display metadata.

export const TAGS = [
  "anxiety", "depression", "burnout", "grief", "loneliness", "intrusive-thoughts", "panic", "insomnia", "trauma",
  "relationships", "family", "work", "self-worth", "recovery", "addiction", "adhd", "vent", "small-wins", "dark-humor", "advice-wanted",
] as const;
export type Tag = (typeof TAGS)[number];

export const STRUGGLES = [
  "anxiety", "depression", "burnout", "grief", "loneliness", "intrusive-thoughts", "panic", "insomnia", "trauma",
  "relationships", "family", "work", "self-worth", "recovery", "addiction", "adhd",
] as const;

export const TAG_LABELS: Record<Tag, string> = {
  anxiety: "anxiety", depression: "depression", burnout: "burnout", grief: "grief", loneliness: "loneliness",
  "intrusive-thoughts": "intrusive thoughts", panic: "panic", insomnia: "insomnia", trauma: "trauma",
  relationships: "relationships", family: "family", work: "work", "self-worth": "self-worth", recovery: "recovery",
  addiction: "addiction", adhd: "adhd", vent: "vent", "small-wins": "small wins", "dark-humor": "dark humour", "advice-wanted": "advice wanted",
};

export const STRUGGLE_BLURBS: Record<(typeof STRUGGLES)[number], string> = {
  anxiety: "the what-ifs", depression: "the heavy fog", burnout: "running on empty", grief: "someone missing",
  loneliness: "surrounded, still alone", "intrusive-thoughts": "thoughts that aren't yours", panic: "the alarm with no fire",
  insomnia: "3am and awake", trauma: "the old wiring", relationships: "hearts, mostly complicated", family: "where it started",
  work: "the job eating you", "self-worth": "never quite enough", recovery: "one day at a time", addiction: "the thing you're leaving", adhd: "40 tabs open",
};

export const CONTENT_WARNINGS = ["self-harm", "suicidal-thoughts", "abuse", "eating", "substance-use", "loss"] as const;
export const CW_LABELS: Record<(typeof CONTENT_WARNINGS)[number], string> = {
  "self-harm": "self-harm", "suicidal-thoughts": "suicidal thoughts", abuse: "abuse", eating: "eating / body", "substance-use": "substance use", loss: "loss",
};

export const REACTIONS = ["HEART", "FEEL_THIS", "NOT_ALONE", "STRENGTH", "HUG"] as const;
export type ReactionType = (typeof REACTIONS)[number];
export const REACTION_META: Record<ReactionType, { label: string; short: string }> = {
  HEART: { label: "Heart", short: "heart" },
  FEEL_THIS: { label: "I feel this", short: "feel this" },
  NOT_ALONE: { label: "You're not alone", short: "not alone" },
  STRENGTH: { label: "Sending strength", short: "strength" },
  HUG: { label: "Hug", short: "hug" },
};

/** Custom circle glyph keys — mirrored in backend/src/lib/constants.ts; drawn in components/icons/circle-icon.tsx. */
export const CIRCLE_ICONS = [
  "together", "moon", "flame", "candle", "wave", "sprout", "brain", "sparkle", "coffee", "rain", "leaf", "teddy", "headphones", "notebook", "feather", "bubbles", "umbrella",
] as const;
export type CircleIconKey = (typeof CIRCLE_ICONS)[number];

export const FEELINGS = ["anxious", "numb", "sad", "angry", "tired", "overwhelmed", "lonely", "hopeful", "calm", "grateful", "restless", "okay"] as const;
export type Feeling = (typeof FEELINGS)[number];

export const MOOD_SCALE = [
  { score: 1, label: "awful", color: "var(--rose)" },
  { score: 2, label: "rough", color: "var(--gold)" },
  { score: 3, label: "meh", color: "var(--fg-muted)" },
  { score: 4, label: "okay", color: "var(--sky)" },
  { score: 5, label: "good", color: "var(--sage)" },
] as const;

export const LIMITS = { post: 2000, comment: 600, bio: 200, displayName: 40, dm: 2000, companion: 2000, thought: 1000 };

export const HELPLINES = [
  { country: "IN", name: "Tele-MANAS (Govt. of India, 24/7)", contact: "14416", tel: "14416", url: "https://telemanas.mohfw.gov.in" },
  { country: "IN", name: "iCall (TISS)", contact: "9152987821", tel: "+919152987821", url: "https://icallhelpline.org" },
  { country: "IN", name: "Vandrevala Foundation (24/7)", contact: "1860-2662-345", tel: "18602662345", url: "https://www.vandrevalafoundation.com" },
  { country: "US", name: "988 Suicide & Crisis Lifeline", contact: "988", tel: "988", url: "https://988lifeline.org" },
  { country: "UK", name: "Samaritans", contact: "116 123", tel: "116123", url: "https://www.samaritans.org" },
  { country: "INTL", name: "Find a helpline anywhere", contact: "findahelpline.com", tel: null, url: "https://findahelpline.com" },
] as const;

export const CRISIS_KEYWORDS = [
  "kill myself", "end my life", "want to die", "wanna die", "better off dead", "suicide", "suicidal", "not worth living",
  "no reason to live", "end it all", "hurt myself", "self harm", "self-harm", "don't want to exist", "dont want to exist",
  "want to disappear", "can't go on", "cant go on", "can't do this anymore", "cant do this anymore",
];
export const detectCrisis = (text: string) => {
  const t = text.toLowerCase();
  return CRISIS_KEYWORDS.some((k) => t.includes(k));
};

export const PLUS_PRICE = "₹199";
