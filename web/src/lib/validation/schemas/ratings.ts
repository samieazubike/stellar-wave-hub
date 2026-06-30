import { z } from "zod";

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
  review_text: z.string().nullable().optional(),
  tx_hash: z.string().nullable().optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
