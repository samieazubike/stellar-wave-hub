import type { z } from "zod";
import type { changeUserRoleSchema } from "./validation/schemas/admin-users";

type UserRole = z.infer<typeof changeUserRoleSchema>["role"];

export interface ManagedUser {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export const ADMIN_USERS_PAGE_SIZE = 25;

/** Public shape returned by the admin users list. Never includes password_hash. */
export interface AdminUserListItem {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export interface AdminUserListQuery {
  search?: string;
  role?: UserRole;
  page?: number;
}

/** Normalizes raw query params into safe pagination/filter values. */
export function normalizeAdminUserListQuery(input: {
  search?: string | null;
  role?: string | null;
  page?: string | null;
}): Required<Pick<AdminUserListQuery, "page">> & { search: string; role: UserRole | null } {
  const search = (input.search ?? "").trim().slice(0, 200);
  const parsedPage = Number.parseInt(input.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const role = input.role === "admin" || input.role === "user" ? (input.role as UserRole) : null;
  return { search, role, page };
}

/** Computes the SQL-style offset for a 1-based page number. */
export function adminUsersOffset(page: number): number {
  return (Math.max(1, page) - 1) * ADMIN_USERS_PAGE_SIZE;
}

/** Projects a DB row into the public list shape, dropping any sensitive fields. */
export function toAdminUserListItem(row: {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  [key: string]: unknown;
}): AdminUserListItem {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
}

export function roleChangeError(actorId: number, target: ManagedUser, role: UserRole, adminCount: number): string | null {
  if (target.role === "admin" && role !== "admin") {
    if (actorId === target.id) return "You cannot demote yourself";
    if (adminCount <= 1) return "Cannot demote the last admin";
  }
  return null;
}
