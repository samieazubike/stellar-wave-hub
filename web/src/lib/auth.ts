import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES, hasMinRole, type Role } from "./roles.ts";

const JWT_SECRET = process.env.JWT_SECRET || "stellar-wave-hub-dev-secret";

export { ROLES, hasMinRole };
export type { Role };

export const ACTIONS = [
  "approve",
  "reject",
  "feature",
  "delete",
  "delist",
  "manage-users",
] as const;
export type Action = (typeof ACTIONS)[number];

export type AuthUser = {
  userId: number;
  role: string;
};

export const PERMISSIONS: Readonly<Record<Role, Readonly<Record<Action, boolean>>>> = {
  contributor: {
    approve: false,
    reject: false,
    feature: false,
    delete: false,
    delist: false,
    "manage-users": false,
  },
  maintainer: {
    approve: true,
    reject: true,
    feature: true,
    delete: false,
    delist: true,
    "manage-users": false,
  },
  admin: {
    approve: true,
    reject: true,
    feature: true,
    delete: true,
    delist: true,
    "manage-users": true,
  },
};

function isRole(role: string): role is Role {
  return role in ROLES;
}

function isAction(action: string): action is Action {
  return ACTIONS.some((knownAction) => knownAction === action);
}

export function can(role: string, action: string): boolean {
  return isRole(role) && isAction(action) && PERMISSIONS[role][action];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Partial<AuthUser>;
    if (typeof payload.userId !== "number" || typeof payload.role !== "string") {
      return null;
    }
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export function getAuthUser(request: Request): AuthUser | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7));
}

export function requireRole(request: Request, minRole: Role): AuthUser | null {
  const auth = getAuthUser(request);
  return auth && hasMinRole(auth.role, minRole) ? auth : null;
}
