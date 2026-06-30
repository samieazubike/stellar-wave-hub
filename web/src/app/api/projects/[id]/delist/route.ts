import { projectsCol, moderationLogCol, nextId, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function PUT(
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

  try {
    const body = await request.json().catch(() => ({}));
    await ref.update({
      status: "delisted",
      featured: 0,
      rejection_reason: body.reason || "Delisted by admin",
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
      action: "delist",
      action_details: {
        reason: body.reason || "Delisted by admin",
        previous_status: doc.data()!.status,
      },
      created_at: new Date().toISOString(),
    });

    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Delist error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
