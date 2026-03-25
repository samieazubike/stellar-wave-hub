import { projectsCol, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

type UserRow = {
  username?: string;
};

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await projectsCol.ref
    .where("status", "==", "submitted")
    .orderBy("created_at", "desc")
    .get();

  const projects = await Promise.all(
    snap.docs.map(async (d) => {
      const p = d.data();
      let username = null;
      if (p.user_id) {
        const uDoc = await usersCol.ref.doc(String(p.user_id)).get();
        username = uDoc.exists
          ? ((uDoc.data() as UserRow).username ?? null)
          : null;
      }
      return { ...p, id: p.numericId, username };
    })
  );

  return Response.json({ projects });
}
