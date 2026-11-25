import { z } from "zod";

export const userRoleSchema = z.enum(["contributor", "maintainer", "admin"]);
export const changeUserRoleSchema = z.object({ role: userRoleSchema }).strict();
export const adminUserQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  role: userRoleSchema.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
