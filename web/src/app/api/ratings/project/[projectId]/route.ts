import { ratingsCol, usersCol, ratingVotesCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const auth = getAuthUser(request);
  const currentUserId = auth?.userId ?? null;

  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") || "helpful";

  const snap = await ratingsCol.ref
    .where("project_id", "==", Number(projectId))
    .get();

  let ratings = await Promise.all(
    snap.docs.map(async (d) => {
      const r = d.data();
      const ratingId = Number(r.numericId ?? d.id);
      let username = "unknown";
      let avatar_url: string | null = null;
      if (r.user_id) {
        const u = await usersCol.ref.doc(String(r.user_id)).get();
        if (u.exists) {
          username = u.data()!.username;
          avatar_url = u.data()!.avatar_url ?? null;
        }
      }
      const votesSnap = await ratingVotesCol.ref
        .where("rating_id", "==", ratingId)
        .get();
      const helpful_count = votesSnap.docs.length;
      const has_voted = currentUserId
        ? votesSnap.docs.some((vote) => vote.data().user_id === currentUserId)
        : false;

      return {
        ...r,
        id: ratingId,
        score: Number(r.score || 0),
        created_at: String(r.created_at ?? ""),
        username,
        avatar_url,
        helpful_count,
        has_voted,
      };
    })
  );

  // Sorting
  ratings = ratings.sort((a, b) => {
    if (sort === "helpful") {
      // Sort primarily by helpfulness count desc, secondary by created_at desc
      const diff = (b.helpful_count || 0) - (a.helpful_count || 0);
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === "highest") {
      const diff = (b.score || 0) - (a.score || 0);
      if (diff !== 0) return diff;
      return (b.helpful_count || 0) - (a.helpful_count || 0);
    }
    if (sort === "lowest") {
      const diff = (a.score || 0) - (b.score || 0);
      if (diff !== 0) return diff;
      return (b.helpful_count || 0) - (a.helpful_count || 0);
    }
    return 0;
  });

  return Response.json({ ratings });
}
