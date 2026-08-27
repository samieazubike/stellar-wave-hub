import { projectsCol, usersCol } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

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
        username = uDoc.exists ? uDoc.data()!.username : null;
      }
      return { ...p, id: p.numericId, username };
    })
  );

  return Response.json({ projects });
}
