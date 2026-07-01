export type UserRole = string;

const REVIEWER_ROLES = new Set<UserRole>(["admin", "maintainer"]);

export function canReviewProjects(role: UserRole | null | undefined): boolean {
  return Boolean(role && REVIEWER_ROLES.has(role));
}

export function canFeatureProjects(role: UserRole | null | undefined): boolean {
  return role === "admin";
}
