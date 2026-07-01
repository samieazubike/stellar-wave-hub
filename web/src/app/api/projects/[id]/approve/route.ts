import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { canFeatureProjects, canReviewProjects } from "@/lib/rbac";
import { canModerateCategory } from "@/lib/maintainerCategories";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || !canReviewProjects(auth.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });
  const project = doc.data()!;

  if (!(await canModerateCategory(auth, project.category as string))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const featured = body.featured && canFeatureProjects(auth.role) ? 1 : 0;
    const status = featured ? "featured" : "approved";

    await ref.update({ status, featured, updated_at: new Date().toISOString() });
    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
