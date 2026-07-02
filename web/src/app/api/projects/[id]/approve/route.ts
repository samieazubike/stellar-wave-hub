import { projectsCol } from "@/lib/db";
import { notifyProjectStatusChange } from "@/lib/notifications";
import { getAuthUser } from "@/lib/auth";
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

    const previous = doc.data()!;
    await ref.update({ status, featured, updated_at: new Date().toISOString() });
    await notifyProjectStatusChange({
      projectId: previous.numericId as number,
      projectName: previous.name as string,
      userId: previous.user_id as number,
      fromStatus: previous.status as string,
      toStatus: status,
    });
    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
