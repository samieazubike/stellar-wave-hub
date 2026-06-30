import { approvalRequestsCol, projectsCol, ratingsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { reviewApprovalSchema } from "@/lib/validation/schemas/approval";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requestId } = await params;
  const reqRef = approvalRequestsCol.ref.doc(requestId);
  const reqDoc = await reqRef.get();

  if (!reqDoc.exists) {
    return Response.json({ error: "Approval request not found" }, { status: 404 });
  }

  const approvalData = reqDoc.data()!;

  if (approvalData.status !== "pending") {
    return Response.json({ error: "Request has already been reviewed" }, { status: 409 });
  }

  // Core rule: the approver must be a different admin than the requester
  if (approvalData.requested_by === auth.userId) {
    return Response.json(
      { error: "You cannot approve your own request. A second admin must confirm this action." },
      { status: 403 }
    );
  }

  const parsed = await parseJsonBody(request, reviewApprovalSchema);
  if (!parsed.success) return parsed.response;

  try {
    const now = new Date().toISOString();
    const projectRef = projectsCol.ref.doc(String(approvalData.project_id));
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Execute the actual sensitive action
    const actionType = approvalData.action_type as string;
    if (actionType === "feature") {
      await projectRef.update({ status: "featured", featured: 1, updated_at: now });
    } else if (actionType === "unfeature") {
      await projectRef.update({ status: "approved", featured: 0, updated_at: now });
    } else if (actionType === "delete") {
      const rSnap = await ratingsCol.ref
        .where("project_id", "==", Number(approvalData.project_id))
        .get();
      const batch = projectsCol.ref.firestore.batch();
      rSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(projectRef);
      await batch.commit();
    }

    // Mark request as approved
    await reqRef.update({
      status: "approved",
      reviewer_id: auth.userId,
      reviewer_note: parsed.data.note || null,
      reviewed_at: now,
      updated_at: now,
    });

    return Response.json({ message: "Action approved and executed" });
  } catch (err) {
    console.error("Approve approval request error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
