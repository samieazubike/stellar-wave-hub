import { projectsCol, createNotification, logModerationAction } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { featuredProjectSchema } from "@/lib/validation/schemas/featured";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { revalidatePublicProjectCache } from "@/lib/public-project-cache";
export const dynamic = "force-dynamic";

const moderationActionLimit = { limit: 30, windowMs: 60_000 };

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "maintainer")) {
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
  if (parsed.data.featured && !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const featured = parsed.data.featured ? 1 : 0;
    const status = featured ? "featured" : "approved";

    await ref.update({
      status,
      featured,
      claimed_by: null,
      claimed_at: null,
      updated_at: new Date().toISOString(),
    });
    revalidatePublicProjectCache();
    const updated = await ref.get();
    const projectData = updated.data()!;
    await logModerationAction({
      actor_id: auth.userId,
      action: featured ? "feature" : "approve",
      project_id: projectData.numericId as number,
    });

    await createNotification({
      user_id: projectData.user_id as number,
      project_id: projectData.numericId as number,
      project_name: projectData.name as string,
      status,
      message: featured
        ? `Your project "${projectData.name}" has been featured.`
        : `Your project "${projectData.name}" has been approved.`,
    });

    return Response.json({ project: { ...projectData, id: projectData.numericId } });
  } catch (err) {
    console.error("Approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
