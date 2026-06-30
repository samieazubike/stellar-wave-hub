import { projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { delistProjectSchema } from "@/lib/validation/schemas/featured";
import { recordModerationLog } from "@/lib/moderationLog";
export const dynamic = "force-dynamic";

export async function PUT(
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

  const parsed = await parseJsonBody(request, delistProjectSchema);
  if (!parsed.success) return parsed.response;

  try {
    const projectId = doc.data()!.numericId as number;
    const reason = parsed.data.reason || "Delisted by admin";

    await ref.update({
      status: "delisted",
      featured: 0,
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    });
    await recordModerationLog({
      actorId: auth.userId,
      action: "delist",
      projectId,
      reason,
    });
    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Delist error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
