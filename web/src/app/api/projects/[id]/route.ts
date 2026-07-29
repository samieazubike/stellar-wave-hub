import { projectsCol, usersCol, ratingsCol } from "@/lib/db";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    .orderBy("created_at", "desc")
    .get();

  const ratings: Record<string, unknown>[] = await Promise.all(
    rSnap.docs.map(async (d) => {
      const r = d.data();
      let username = "unknown";
      if (r.user_id) {
        const u = await usersCol.ref.doc(String(r.user_id)).get();
        if (u.exists) username = u.data()!.username;
      }
      return { ...r, id: r.numericId ?? d.id, username };
    })
  );

  // Attach helpful vote counts
  const ratingIds = ratings.map((r) => r.numericId as number).filter(Boolean);
  if (ratingIds.length > 0) {
    const supabase = getSupabase();
    const { data: voteRows } = await supabase
      .from("rating_votes")
      .select("rating_id")
      .in("rating_id", ratingIds);

    const countMap = new Map<number, number>();
    for (const v of voteRows ?? []) {
      const rid = Number(v.rating_id);
      countMap.set(rid, (countMap.get(rid) ?? 0) + 1);
    }

    for (const r of ratings) {
      const rid = r.numericId as number | undefined;
      r.helpful_count = rid ? (countMap.get(rid) ?? 0) : 0;
    }
  } else {
    for (const r of ratings) {
      r.helpful_count = 0;
    }
  }

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

  return Response.json({ project: projectData, ratings, averages });
}
