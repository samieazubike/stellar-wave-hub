import { z } from "zod";

export const userRoleSchema = z.enum(["contributor", "maintainer", "admin"]);
export const changeUserRoleSchema = z.object({ role: userRoleSchema }).strict();
export const adminUserQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  role: userRoleSchema.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

export const ADMIN_USERS_PAGE_SIZE = 25;

export const adminUserListItemSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: userRoleSchema,
    created_at: z.string(),
  })
  .strict();

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;
