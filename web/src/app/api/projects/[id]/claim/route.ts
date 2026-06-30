import { projectsCol, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isClaimStale } from "@/lib/claims";
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

  const data = doc.data()!;
  const body = await request.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "release") {
    await ref.update({ claimed_by: null, claimed_at: null, updated_at: new Date().toISOString() });
  } else {
    const currentClaimant = data.claimed_by as number | null;
    const claimedAt = data.claimed_at as string | null;

    if (currentClaimant && currentClaimant !== auth.userId && claimedAt && !isClaimStale(claimedAt)) {
      return Response.json({ error: "This project is already being reviewed by another admin" }, { status: 409 });
    }

    const now = new Date().toISOString();
    await ref.update({ claimed_by: auth.userId, claimed_at: now, updated_at: now });
  }

  const updated = await ref.get();
  const updatedData = updated.data()!;
  let claimed_by_username: string | null = null;
  if (updatedData.claimed_by) {
    const uDoc = await usersCol.ref.doc(String(updatedData.claimed_by)).get();
    claimed_by_username = uDoc.exists ? (uDoc.data()!.username as string) : null;
  }

  return Response.json({
    project: { ...updatedData, id: updatedData.numericId, claimed_by_username },
  });
}
