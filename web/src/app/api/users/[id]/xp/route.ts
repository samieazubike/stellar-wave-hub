import { usersCol } from "@/lib/db";
import { computeXp } from "@/lib/xp";
export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

export async function GET(
  _request: Request,
  // Next requires one param name per path level; /api/users/[id]/categories
  // uses a numeric id, while this route receives the username in that slot.
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: username } = await params;

  // Look up user by username
  const userSnap = await usersCol.ref
    .where("username", "==", username)
    .limit(1)
    .get();

  if (userSnap.empty) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const userDoc = userSnap.docs[0];
  const userData = userDoc.data();
  const userId = userData.numericId as number;

  // Compute XP
  const xp = await computeXp(userId);

  return Response.json({
    username,
    userId,
    xp,
  });
}