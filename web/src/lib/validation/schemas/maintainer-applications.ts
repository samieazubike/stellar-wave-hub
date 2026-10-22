import { z } from "zod";

export const maintainerApplicationSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(2000, "Reason must be 2000 characters or fewer"),
});

export const reviewMaintainerApplicationSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    message: "Invalid status. Must be 'approved' or 'rejected'.",
  }),
});
