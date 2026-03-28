import { z } from "zod";

const VALID_TAGS = [
  "depression",
  "anxiety",
  "burnout",
  "grief",
  "intrusive-thoughts",
  "vent",
  "meme",
  "relationship",
  "loneliness",
  "recovery",
  "insomnia",
  "trauma",
] as const;

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(500, "Post cannot exceed 500 characters"),
  tags: z
    .array(z.enum(VALID_TAGS))
    .max(3, "Maximum 3 tags allowed")
    .default([]),
  isAnonymous: z.boolean().default(false),
  imageUrl: z.string().url().optional().nullable(),
});

export { VALID_TAGS };
