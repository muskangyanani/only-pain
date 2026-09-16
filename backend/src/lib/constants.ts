// Shared vocabularies. The frontend mirrors these in src/lib/constants.ts.

export const TAGS = [
  "anxiety",
  "depression",
  "burnout",
  "grief",
  "loneliness",
  "intrusive-thoughts",
  "panic",
  "insomnia",
  "trauma",
  "relationships",
  "family",
  "work",
  "self-worth",
  "recovery",
  "addiction",
  "adhd",
  "vent",
  "small-wins",
  "dark-humor",
  "advice-wanted",
] as const;
export type Tag = (typeof TAGS)[number];

/** Onboarding "what are you carrying" options — a subset of TAGS. */
export const STRUGGLES = [
  "anxiety",
  "depression",
  "burnout",
  "grief",
  "loneliness",
  "intrusive-thoughts",
  "panic",
  "insomnia",
  "trauma",
  "relationships",
  "family",
  "work",
  "self-worth",
  "recovery",
  "addiction",
  "adhd",
] as const;

export const CONTENT_WARNINGS = [
  "self-harm",
  "suicidal-thoughts",
  "abuse",
  "eating",
  "substance-use",
  "loss",
] as const;

export const REACTIONS = ["HEART", "FEEL_THIS", "NOT_ALONE", "STRENGTH", "HUG"] as const;

export const FEELINGS = [
  "anxious",
  "numb",
  "sad",
  "angry",
  "tired",
  "overwhelmed",
  "lonely",
  "hopeful",
  "calm",
  "grateful",
  "restless",
  "okay",
] as const;

export const LIMITS = {
  post: 2000,
  comment: 600,
  bio: 200,
  displayName: 40,
  dm: 2000,
  companion: 2000,
  thought: 1000,
  circleName: 40,
  circleTagline: 120,
  circleDescription: 1000,
};

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const RESERVED_USERNAMES = new Set([
  "admin",
  "anonymous",
  "ember",
  "onlypain",
  "only_pain",
  "support",
  "help",
  "mod",
  "moderator",
  "system",
  "root",
  "me",
]);
