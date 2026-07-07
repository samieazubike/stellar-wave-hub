export const ROLES = {
  contributor: 0,
  maintainer: 1,
  admin: 2,
} as const;

export type Role = keyof typeof ROLES;

export function hasMinRole(userRole: string, minRole: string): boolean {
  const userLevel = ROLES[userRole as keyof typeof ROLES] ?? -1;
  const minLevel = ROLES[minRole as keyof typeof ROLES] ?? -1;
  return userLevel >= minLevel;
}
