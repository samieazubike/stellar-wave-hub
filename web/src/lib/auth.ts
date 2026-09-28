import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES, hasMinRole } from "./roles";
import { maintainerCategoriesCol } from "./db";

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

// Valid project categories
export const VALID_CATEGORIES = [
  "defi",
  "payments",
  "infrastructure",
  "tooling",
  "nft",
  "dao",
  "social",
  "gaming",
  "rwa",
  "other",
] as const;

export type Category = (typeof VALID_CATEGORIES)[number];

// Fetch the categories a user is assigned to maintain
export async function getMaintainerCategories(userId: number): Promise<string[]> {
  const snap = await maintainerCategoriesCol
    .ref
    .where("userId", "==", userId)
    .get();

  if (snap.empty) return [];

  return snap.docs.map((d: { data: () => Record<string, unknown> }) => String(d.data().category));
}

// Check if a user is authorized to moderate a project based on category
export async function canModerateProject(
  userId: number,
  role: string,
  projectCategory: string,
): Promise<boolean> {
  // Admins can moderate everything
  if (role === "admin") return true;

  // Check if user is a maintainer for this category
  const categories = await getMaintainerCategories(userId);
  return categories.includes(projectCategory);
}
