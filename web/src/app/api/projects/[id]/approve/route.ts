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

  // Featuring a project is a sensitive action — must go through two-person approval.
  // Callers should POST /api/projects/:id/request-approval instead.
  if (parsed.data.featured === true) {
    return Response.json(
      {
        error: "Featuring a project requires two-person approval. Use POST /api/projects/:id/request-approval with action 'feature'.",
        requiresApproval: true,
        action: "feature",
      },
      { status: 403 }
    );
  }

  try {
    // Unfeature (featured → approved) also requires approval workflow
    const current = doc.data()!;
    if (current.featured === 1 && parsed.data.featured === false) {
      return Response.json(
        {
          error: "Unfeaturing a project requires two-person approval. Use POST /api/projects/:id/request-approval with action 'unfeature'.",
          requiresApproval: true,
          action: "unfeature",
        },
        { status: 403 }
      );
    }

    // Plain approve (submitted/rejected/delisted → approved, featured stays 0)
    await ref.update({ status: "approved", featured: 0, updated_at: new Date().toISOString() });
    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
