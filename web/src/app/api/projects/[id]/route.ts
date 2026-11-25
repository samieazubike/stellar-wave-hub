import { projectsCol, usersCol, ratingsCol, ratingVotesCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { publicProjectCacheHeaders } from "@/lib/public-project-cache";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = getAuthUser(request);
  const currentUserId = auth?.userId ?? null;

  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") || "helpful";

  // Lookup by numeric ID or slug
  const isNumeric = /^\d+$/.test(id);
  let projectData: Record<string, unknown> | null = null;

  if (isNumeric) {
    const doc = await projectsCol.ref.doc(id).get();
    if (doc.exists) projectData = { ...doc.data()!, id: doc.data()!.numericId };
  } else {
    const snap = await projectsCol.ref.where("slug", "==", id).limit(1).get();
    if (!snap.empty) {
      const d = snap.docs[0].data();
      projectData = { ...d, id: d.numericId };
    }
  }

  if (!projectData) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch user info
  const uid = projectData.user_id as number;
  if (uid) {
    const uDoc = await usersCol.ref.doc(String(uid)).get();
    if (uDoc.exists) {
      projectData.username = uDoc.data()!.username;
      projectData.user_github = uDoc.data()!.github_url;
    }
  }

  // Fetch ratings
  const rSnap = await ratingsCol.ref
    .where("project_id", "==", projectData.id)
    .get();

  let ratings: Record<string, unknown>[] = await Promise.all(
    rSnap.docs.map(async (d) => {
      const r = d.data();
      const ratingId = Number(r.numericId ?? d.id);
      let username = "unknown";
      if (r.user_id) {
        const u = await usersCol.ref.doc(String(r.user_id)).get();
        if (u.exists) username = u.data()!.username;
      }

      // Fetch votes for this rating
      const votesSnap = await ratingVotesCol.ref
        .where("rating_id", "==", ratingId)
        .get();

      const helpful_count = votesSnap.docs.length;
      const has_voted = currentUserId
        ? votesSnap.docs.some((doc) => doc.data().user_id === currentUserId)
        : false;

      return {
        ...r,
        id: ratingId,
        username,
        helpful_count,
        has_voted,
      };
    })
  );

  // Sorting
  ratings = ratings.sort((a, b) => {
    const countA = Number(a.helpful_count || 0);
    const countB = Number(b.helpful_count || 0);
    const timeA = new Date(String(a.created_at)).getTime();
    const timeB = new Date(String(b.created_at)).getTime();
    const scoreA = Number(a.score || 0);
    const scoreB = Number(b.score || 0);

    if (sort === "helpful") {
      const diff = countB - countA;
      if (diff !== 0) return diff;
      return timeB - timeA;
    }
    if (sort === "recent") {
      return timeB - timeA;
    }
    if (sort === "highest") {
      const diff = scoreB - scoreA;
      if (diff !== 0) return diff;
      return countB - countA;
    }
    if (sort === "lowest") {
      const diff = scoreA - scoreB;
      if (diff !== 0) return diff;
      return countB - countA;
    }
    return 0;
  });


  // Compute averages
  const scores = ratings.map((r) => r.score as number);
  const purposeScores = ratings.map((r) => r.purpose_score as number).filter(Boolean);
  const innovationScores = ratings.map((r) => r.innovation_score as number).filter(Boolean);
  const usabilityScores = ratings.map((r) => r.usability_score as number).filter(Boolean);
  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  const averages = {
    avg_score: avg(scores),
    avg_purpose: avg(purposeScores),
    avg_innovation: avg(innovationScores),
    avg_usability: avg(usabilityScores),
    total: ratings.length,
  };

  return Response.json(
    { project: projectData, ratings, averages },
    {
      // has_voted is per-user, so signed-in responses must not hit a shared cache.
      headers: currentUserId
        ? { "Cache-Control": "private, no-store" }
        : publicProjectCacheHeaders,
    }
  );
}
