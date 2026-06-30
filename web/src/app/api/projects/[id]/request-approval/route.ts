import { projectsCol, approvalRequestsCol, nextId } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { requestApprovalSchema } from "@/lib/validation/schemas/approval";
export const dynamic = "force-dynamic";

export async function POST(
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

  const parsed = await parseJsonBody(request, requestApprovalSchema);
  if (!parsed.success) return parsed.response;

  const { action, reason } = parsed.data;

  // Check if there's already a pending request for this project+action
  const existing = await approvalRequestsCol.ref
    .where("project_id", "==", Number(id))
    .where("action_type", "==", action)
    .where("status", "==", "pending")
    .get();

  if (!existing.empty) {
    return Response.json(
      { error: "A pending approval request already exists for this action" },
      { status: 409 }
    );
  }

  try {
    const numericId = await nextId("approval_requests");
    const now = new Date().toISOString();
    const data = {
      numericId,
      project_id: Number(id),
      action_type: action,
      requested_by: auth.userId,
      status: "pending",
      reason: reason || null,
      reviewer_id: null,
      reviewer_note: null,
      reviewed_at: null,
      created_at: now,
      updated_at: now,
    };

    await approvalRequestsCol.ref.doc(String(numericId)).set(data);
    return Response.json({ approvalRequest: data }, { status: 201 });
  } catch (err) {
    console.error("Request approval error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
