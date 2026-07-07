import { projectsCol, moderationLogCol, nextId, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { featuredProjectSchema } from "@/lib/validation/schemas/featured";
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

  const parsed = await parseJsonBody(request, featuredProjectSchema);
  if (!parsed.success) return parsed.response;

  try {
    const featured = parsed.data.featured ? 1 : 0;
    const status = featured ? "featured" : "approved";
    const action = featured ? "feature" : "approve";

    await ref.update({ status, featured, updated_at: new Date().toISOString() });
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
      action,
      action_details: {
        featured: body.featured || false,
        previous_status: doc.data()!.status,
      },
      created_at: new Date().toISOString(),
    });

    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
