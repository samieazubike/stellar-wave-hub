import { z } from "zod";

export const categorySponsorBookingSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  project_id: z.coerce.number().int().positive("Valid project ID is required"),
  tx_hash: z.string().trim().min(1, "Transaction hash is required"),
  starts_at: z.string().datetime().optional(),
});

export type CategorySponsorBookingInput = z.infer<typeof categorySponsorBookingSchema>;
