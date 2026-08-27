import { projectsCol } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";

const moderationActionLimit = { limit: 30, windowMs: 60_000 };

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

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

    await ref.update({ status, featured, updated_at: new Date().toISOString() });
    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
