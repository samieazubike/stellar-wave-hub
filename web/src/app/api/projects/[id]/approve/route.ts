import { projectsCol } from "@/lib/db";
import { notifyProjectStatusChange } from "@/lib/notifications";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });

  try {
    const body = await request.json().catch(() => ({}));
    const featured = body.featured ? 1 : 0;
    const status = featured ? "featured" : "approved";

    const previous = doc.data()!;
    await ref.update({ status, featured, updated_at: new Date().toISOString() });
    await notifyProjectStatusChange({
      projectId: previous.numericId as number,
      projectName: previous.name as string,
      userId: previous.user_id as number,
      fromStatus: previous.status as string,
      toStatus: status,
    });
    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
