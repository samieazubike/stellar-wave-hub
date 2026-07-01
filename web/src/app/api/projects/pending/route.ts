import { projectsCol, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { canReviewProjects } from "@/lib/rbac";
import { getMaintainerCategories } from "@/lib/maintainerCategories";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !canReviewProjects(auth.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = projectsCol.ref.where("status", "==", "submitted");
  let assignedCategories: string[] | null = null;

  if (auth.role === "maintainer") {
    assignedCategories = await getMaintainerCategories(auth.userId);
    if (assignedCategories.length === 0) {
      return Response.json({ projects: [], assignedCategories });
    }
    query = query.where("category", "in", assignedCategories);
  }

  const snap = await query.orderBy("created_at", "desc").get();

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

  return Response.json({ projects, assignedCategories });
}
