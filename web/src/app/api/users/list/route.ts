import { usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

// GET /api/users/list — List users (admin only, for maintainer management)
export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await usersCol.ref.where("role", "==", "maintainer").get();

  const users = snap.docs.map((d) => {
    const u = d.data();
    return {
      id: u.numericId,
      username: u.username,
      email: u.email,
      role: u.role,
    };
  });

  return Response.json({ users });
}
