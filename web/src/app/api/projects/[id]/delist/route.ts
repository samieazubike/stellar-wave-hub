import { projectsCol, createNotification } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { delistProjectSchema } from "@/lib/validation/schemas/featured";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });

  const parsed = await parseJsonBody(request, delistProjectSchema);
  if (!parsed.success) return parsed.response;

  try {
    const reason = parsed.data.reason || "Delisted by admin";
    await ref.update({
      status: "delisted",
      featured: 0,
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    });
    const updated = await ref.get();
    const projectData = updated.data()!;

    await createNotification({
      user_id: projectData.user_id as number,
      project_id: projectData.numericId as number,
      project_name: projectData.name as string,
      status: "delisted",
      message: `Your project "${projectData.name}" has been delisted. Reason: ${reason}`,
    });

    return Response.json({ project: { ...projectData, id: projectData.numericId } });
  } catch (err) {
    console.error("Delist error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
