import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

type ProjectRow = {
  numericId: number;
};

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
    await ref.update({
      status: "rejected",
      rejection_reason: body.reason || null,
      updated_at: new Date().toISOString(),
    });
    const updated = await ref.get();
    const project = updated.data() as ProjectRow & Record<string, unknown>;
    return Response.json({ project: { ...project, id: project.numericId } });
  } catch (err) {
    console.error("Reject error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
