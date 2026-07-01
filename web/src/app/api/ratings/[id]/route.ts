import { ratingsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ref = ratingsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Rating not found" }, { status: 404 });

  const rating = doc.data()!;
  if (rating.user_id !== auth.userId && !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await ref.delete();
  return Response.json({ message: "Rating deleted" });
}
