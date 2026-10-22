import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { projectsCol } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/projects/[id]/priority
// Body: { tx_hash?: string; duration_days?: number }
// Sets priority_until = now + duration_days on a submitted project owned by the caller.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projectId = Number(id);
  if (isNaN(projectId)) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  let body: { tx_hash?: string; duration_days?: number } = {};
  try {
    body = await request.json();
  } catch {
    // allow empty body — defaults apply
  }

  const durationDays = Number(body.duration_days) > 0 ? Number(body.duration_days) : 7;
  const txHash = body.tx_hash ? String(body.tx_hash).trim() : `priority_tx_${Date.now()}`;

  // Fetch the project from Firestore to verify ownership and status
  const snap = await projectsCol.ref
    .where("numericId", "==", projectId)
    .limit(1)
    .get();

  if (snap.empty) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const projectData = snap.docs[0].data();

  if (projectData.user_id !== auth.userId && auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (projectData.status !== "submitted") {
    return Response.json(
      { error: "Only submitted projects can be fast-tracked" },
      { status: 400 },
    );
  }

  const now = new Date();
  const priorityUntil = new Date(
    now.getTime() + durationDays * 86400 * 1000,
  ).toISOString();

  const supabase = getSupabase();
  const { error: updateError } = await supabase
    .from("projects")
    .update({
      priority_until: priorityUntil,
      updated_at: now.toISOString(),
    })
    .eq("numericId", projectId);

  if (updateError) {
    console.error("Priority update error:", updateError);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json({
    success: true,
    project_id: projectId,
    priority_until: priorityUntil,
    tx_hash: txHash,
    duration_days: durationDays,
  });
}
