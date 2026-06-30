import { z } from "zod";

export const requestApprovalSchema = z.object({
  action: z.enum(["feature", "unfeature", "delete"]),
  reason: z.string().optional(),
});

export const reviewApprovalSchema = z.object({
  note: z.string().optional(),
});

export const rejectApprovalSchema = z.object({
  note: z.string().optional(),
});

export type RequestApprovalInput = z.infer<typeof requestApprovalSchema>;
export type ReviewApprovalInput = z.infer<typeof reviewApprovalSchema>;
