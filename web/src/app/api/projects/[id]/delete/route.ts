import { projectsCol, ratingsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { writeModerationLog } from "@/lib/moderation-log";
export const dynamic = "force-dynamic";

export async function DELETE(
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

  try {
    // Log before delete so the project_id is preserved in the audit trail
    await writeModerationLog({
      actorId: auth.userId,
      action: "delete",
      projectId: Number(id),
    });

    // Delete associated ratings
    const rSnap = await ratingsCol.ref.where("project_id", "==", Number(id)).get();
    const batch = projectsCol.ref.firestore.batch();
    rSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();

    return Response.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
