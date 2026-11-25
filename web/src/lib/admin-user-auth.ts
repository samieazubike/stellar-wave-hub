import { getAuthUser } from "./auth";
import { usersCol } from "./db";

/** Role changes take effect immediately, including for already-issued JWTs. */
export async function requireCurrentAdmin(request: Request): Promise<{ userId: number } | null> {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") return null;
  const actor = await usersCol.ref.doc(String(auth.userId)).get();
  return actor.exists && actor.data()?.role === "admin" ? { userId: auth.userId } : null;
}
