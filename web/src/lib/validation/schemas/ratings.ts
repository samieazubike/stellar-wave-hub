import { z } from "zod";
import { MAX_REVIEW_TEXT_LENGTH } from "../constants";

const optionalSubScore = z
  .union([z.number().int().min(1).max(5), z.literal(0), z.null()])
  .optional();

export const createRatingSchema = z.object({
  project_id: z.coerce
    .number()
    .int()
    .positive("project_id is required"),
  score: z.coerce
    .number()
    .int()
    .min(1, "score must be between 1 and 5")
    .max(5, "score must be between 1 and 5"),
  purpose_score: optionalSubScore,
  innovation_score: optionalSubScore,
  usability_score: optionalSubScore,
  review_text: z
    .string()
    .max(
      MAX_REVIEW_TEXT_LENGTH,
      `Review must be ${MAX_REVIEW_TEXT_LENGTH} characters or fewer`,
    )
    .nullable()
    .optional(),
  tx_hash: z.string().nullable().optional(),
});

export const voteRatingSchema = z.object({
  rating_id: z.coerce
    .number()
    .int()
    .positive("rating_id is required"),
});

export type VoteRatingInput = z.infer<typeof voteRatingSchema>;

export const ratingSortOptions = ["helpful", "recent", "highest", "lowest"] as const;
export type RatingSortOption = (typeof ratingSortOptions)[number];

export const sortRatingQuerySchema = z.object({
  sort: z.enum(ratingSortOptions).default("helpful"),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

export const ownerReplySchema = z.object({
  owner_reply: z
    .string()
    .trim()
    .min(1, "owner_reply is required")
    .max(5000, "owner_reply is too long"),
});

export type OwnerReplyInput = z.infer<typeof ownerReplySchema>;
