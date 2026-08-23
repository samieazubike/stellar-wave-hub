import { projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
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

  // Deletion is a sensitive, irreversible action — requires two-person approval.
  // Callers should POST /api/projects/:id/request-approval with action 'delete'.
  return Response.json(
    {
      error: "Deleting a project requires two-person approval. Use POST /api/projects/:id/request-approval with action 'delete'.",
      requiresApproval: true,
      action: "delete",
    },
    { status: 403 }
  );
}
