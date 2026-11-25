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
export function roleChangeError(actorId: number, target: ManagedUser, role: UserRole, adminCount: number): string | null {
  if (target.role === "admin" && role !== "admin") {
    if (actorId === target.id) return "You cannot demote yourself";
    if (adminCount <= 1) return "Cannot demote the last admin";
  }
  return null;
}
