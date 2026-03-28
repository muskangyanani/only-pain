import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(300, "Comment cannot exceed 300 characters"),
  isAnonymous: z.boolean().default(false),
  parentCommentId: z.string().optional().nullable(),
});
