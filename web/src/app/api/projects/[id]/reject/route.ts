import { projectsCol, moderationLogCol, nextId, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { rejectProjectSchema } from "@/lib/validation/schemas/featured";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

const moderationActionLimit = { limit: 30, windowMs: 60_000 };

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateLimit = checkRateLimit(`maintainer:${auth.userId}:moderation-action`, moderationActionLimit);
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit.retryAfterSeconds);

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });

  const parsed = await parseJsonBody(request, rejectProjectSchema);
  if (!parsed.success) return parsed.response;

  try {
    await ref.update({
      status: "rejected",
      rejection_reason: parsed.data.reason || null,
      updated_at: new Date().toISOString(),
    });
    const updated = await ref.get();

    // Fetch admin user details for logging
    const adminDoc = await usersCol.ref.doc(String(auth.userId)).get();
    const adminData = adminDoc.exists ? adminDoc.data()! : null;

    // Log moderation action
    const logId = await nextId("moderation_log");
    const projectData = updated.data()!;
    await moderationLogCol.ref.doc(String(logId)).set({
      numericId: logId,
      admin_id: auth.userId,
      admin_username: adminData?.username || "unknown",
      project_id: projectData.numericId,
      project_name: projectData.name,
      action: "reject",
      action_details: {
        reason: body.reason || null,
        previous_status: doc.data()!.status,
      },
      created_at: new Date().toISOString(),
    });

    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Reject error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
