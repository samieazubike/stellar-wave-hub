import { approvalRequestsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { rejectApprovalSchema } from "@/lib/validation/schemas/approval";
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

  // The requester cannot reject their own request either (keeps it honest)
  if (approvalData.requested_by === auth.userId) {
    return Response.json(
      { error: "You cannot reject your own request. A second admin must review this action." },
      { status: 403 }
    );
  }

  const parsed = await parseJsonBody(request, rejectApprovalSchema);
  if (!parsed.success) return parsed.response;

  try {
    const now = new Date().toISOString();
    await reqRef.update({
      status: "rejected",
      reviewer_id: auth.userId,
      reviewer_note: parsed.data.note || null,
      reviewed_at: now,
      updated_at: now,
    });

    return Response.json({ message: "Approval request rejected" });
  } catch (err) {
    console.error("Reject approval request error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
