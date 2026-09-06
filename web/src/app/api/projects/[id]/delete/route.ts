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
    const projectId = Number(doc.data()!.numericId);

    // Log first so a successful destructive action can never lose its audit record.
    await writeModerationLog({
      actorId: auth.userId,
      action: "delete",
      projectId,
    });

    const rSnap = await ratingsCol.ref.where("project_id", "==", projectId).get();
    const batch = projectsCol.ref.firestore.batch();
    rSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();

    return Response.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
