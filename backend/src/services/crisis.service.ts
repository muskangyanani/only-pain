import { prisma } from "../lib/prisma.js";
import { CRISIS_KEYWORDS } from "../lib/crisis-keywords.js";

export function scanForCrisisKeywords(text: string): {
  flagged: boolean;
  keywords: string[];
} {
  const lower = text.toLowerCase();
  const found = CRISIS_KEYWORDS.filter((kw) => lower.includes(kw));
  return { flagged: found.length > 0, keywords: found };
}

export async function flagPost(postId: string, keywords: string[]) {
  await prisma.flaggedPost.create({
    data: {
      postId,
      reason: `Crisis keywords detected: ${keywords.join(", ")}`,
    },
  });
}
