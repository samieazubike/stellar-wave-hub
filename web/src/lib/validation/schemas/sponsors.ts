import { z } from "zod";

export const bookSponsorSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  project_id: z.number().int().positive(),
  tx_hash: z.string().min(1),
});

export type BookSponsorInput = z.infer<typeof bookSponsorSchema>;
