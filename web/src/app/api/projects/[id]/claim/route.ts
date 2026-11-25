import { projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { claimExpiryCutoff, isClaimActive } from "@/lib/claims";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "maintainer")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const project = doc.data()!;
  const claimedBy = project.claimed_by ?? null;

  // Already claimed by someone else and that claim has not gone stale.
  if (
    claimedBy !== null &&
    Number(claimedBy) !== auth.userId &&
    isClaimActive(project)
  ) {
    return Response.json(
      { error: "Project is already claimed by another maintainer" },
      { status: 409 }
    );
  }

  try {
    // Conditional update so two maintainers racing for the same project
    // can't both win: only succeeds if the row is still unclaimed, already
    // ours, or its claim has gone stale.
    const staleBefore = claimExpiryCutoff();
    const { data, error } = await getSupabase()
      .from("projects")
      .update({ claimed_by: auth.userId, claimed_at: new Date().toISOString() })
      .eq("numericId", project.numericId)
      .or(`claimed_by.is.null,claimed_by.eq.${auth.userId},claimed_at.lt.${staleBefore}`)
      .select("*");
    if (error) throw error;
    if (!data || data.length === 0) {
      return Response.json(
        { error: "Project is already claimed by another maintainer" },
        { status: 409 }
      );
    }
    const projectData = data[0];
    return Response.json({ project: { ...projectData, id: projectData.numericId } });
  } catch (err) {
    console.error("Claim error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "maintainer")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const project = doc.data()!;
  const claimedBy = project.claimed_by ?? null;

  if (claimedBy === null) {
    return Response.json({ error: "Project is not claimed" }, { status: 409 });
  }

  const isAdmin = auth.role === "admin";
  const isClaimer = Number(claimedBy) === auth.userId;

  if (!isAdmin && !isClaimer) {
    return Response.json(
      { error: "Only the maintainer who claimed this project or an admin can release it" },
      { status: 403 }
    );
  }

  try {
    await ref.update({ claimed_by: null, claimed_at: null });
    const updated = await ref.get();
    const projectData = updated.data()!;
    return Response.json({ project: { ...projectData, id: projectData.numericId } });
  } catch (err) {
    console.error("Release claim error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
