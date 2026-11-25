import { z } from "zod";

export const REPORT_REASONS = [
  "spam",
  "scam",
  "wrong_info",
  "wrong info",
  "abusive",
  "off_topic",
  "misleading",
  "other",
] as const;

export const PROJECT_REPORT_REASONS = [
  { value: "spam", label: "Spam", description: "Promotional spam or duplicate listing" },
  { value: "scam", label: "Scam", description: "Malicious, phishing, or fraudulent activity" },
  { value: "wrong_info", label: "Wrong info", description: "Inaccurate description, broken links, or false claims" },
  { value: "other", label: "Other", description: "Any other issue requiring moderator attention" },
] as const;

export const createReportSchema = z.object({
  target_type: z.enum(["project", "rating"]),
  target_id: z.coerce.number().int().positive("target_id is required"),
  reason: z.enum(REPORT_REASONS),
  note: z.string().max(1000).nullable().optional(),
  details: z.string().max(1000).nullable().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportStatusSchema = z.object({
  id: z.coerce.number().int().positive("A valid report ID is required"),
  status: z.enum(["resolved", "dismissed"], { message: "Status must be resolved or dismissed" }),
});
