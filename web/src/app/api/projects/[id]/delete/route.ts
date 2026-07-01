import { projectsCol, ratingsCol } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (!auth) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });

  // Delete associated ratings
  const rSnap = await ratingsCol.ref.where("project_id", "==", Number(id)).get();
  const batch = projectsCol.ref.firestore.batch();
  rSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();

  return Response.json({ message: "Project deleted" });
}
