import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES, hasMinRole } from "./roles";

const JWT_SECRET = process.env.JWT_SECRET || "stellar-wave-hub-dev-secret";

export { ROLES, hasMinRole };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export function getAuthUser(request: Request): { userId: number; role: string } | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7));
}
