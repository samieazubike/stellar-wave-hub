import { getSupabase } from "@/lib/firebase";
import { scoreXp, type XpActivity } from "@/lib/xp";
import { getAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

const LEADERBOARD_SIZE = 50;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Range = "week" | "all";

// GET /api/leaderboard?range=week|all — users ranked by XP (same rules as lib/xp.ts).
// "week" only counts projects, ratings and helpful votes created in the last 7 days.
export async function GET(request: Request) {
  const rangeParam = new URL(request.url).searchParams.get("range");
  const range: Range = rangeParam === "week" ? "week" : "all";
  const since = range === "week" ? new Date(Date.now() - WEEK_MS).toISOString() : null;

  try {
    const supabase = getSupabase();
    let projectsQuery = supabase.from("projects").select("user_id, created_at").in("status", ["approved", "featured"]);
    let ratingsQuery = supabase.from("ratings").select('"numericId", user_id, review_text, tx_hash, created_at');
    let votesQuery = supabase.from("rating_votes").select("rating_id, created_at");
    if (since) {
      projectsQuery = projectsQuery.gte("created_at", since);
      ratingsQuery = ratingsQuery.gte("created_at", since);
      votesQuery = votesQuery.gte("created_at", since);
    }

    const [projectsRes, ratingsRes, votesRes] = await Promise.all([projectsQuery, ratingsQuery, votesQuery]);
    if (projectsRes.error) throw projectsRes.error;
    if (ratingsRes.error) throw ratingsRes.error;
    // rating_votes may not be migrated yet; treat as no votes rather than failing.
    const votes = votesRes.error ? [] : votesRes.data ?? [];

    const activity = new Map<number, XpActivity>();
    const forUser = (userId: number) => {
      let a = activity.get(userId);
      if (!a) {
        a = { approvedProjectCount: 0, ratings: [], helpfulVotesReceived: 0 };
        activity.set(userId, a);
      }
      return a;
    };

    for (const p of projectsRes.data ?? []) forUser(Number(p.user_id)).approvedProjectCount++;

    // For helpful votes in the range we need every rating's author, not just in-range ratings.
    const ratingAuthor = new Map<number, number>();
    for (const r of ratingsRes.data ?? []) {
      forUser(Number(r.user_id)).ratings.push(r);
      ratingAuthor.set(Number(r.numericId), Number(r.user_id));
    }
    const missingRatingIds = [...new Set(votes.map((v) => Number(v.rating_id)))].filter((id) => !ratingAuthor.has(id));
    if (missingRatingIds.length) {
      const { data, error } = await supabase.from("ratings").select('"numericId", user_id').in("numericId", missingRatingIds);
      if (error) throw error;
      for (const r of data ?? []) ratingAuthor.set(Number(r.numericId), Number(r.user_id));
    }
    for (const v of votes) {
      const author = ratingAuthor.get(Number(v.rating_id));
      if (author !== undefined) forUser(author).helpfulVotesReceived++;
    }

    const scored = [...activity.entries()]
      .map(([userId, a]) => ({ userId, a, xp: scoreXp(a) }))
      .filter((row) => row.xp.total > 0)
      .sort((x, y) => y.xp.total - x.xp.total || x.userId - y.userId)
      .slice(0, LEADERBOARD_SIZE);

    const userIds = scored.map((row) => row.userId);
    const usersRes = userIds.length
      ? await supabase.from("users").select('"numericId", username, avatar_url').in("numericId", userIds)
      : { data: [], error: null };
    if (usersRes.error) throw usersRes.error;
    const users = new Map((usersRes.data ?? []).map((u) => [Number(u.numericId), u]));

    // Achievement badges are lifetime awards, so use all-time activity even on the weekly tab.
    let lifetime = new Map(scored.map((row) => [row.userId, row.a]));
    if (since && userIds.length) {
      const [allProjects, allRatings] = await Promise.all([
        supabase.from("projects").select("user_id").in("status", ["approved", "featured"]).in("user_id", userIds),
        supabase.from("ratings").select("user_id, review_text, tx_hash").in("user_id", userIds),
      ]);
      if (allProjects.error) throw allProjects.error;
      if (allRatings.error) throw allRatings.error;
      lifetime = new Map(userIds.map((id) => [id, { approvedProjectCount: 0, ratings: [], helpfulVotesReceived: 0 } as XpActivity]));
      for (const p of allProjects.data ?? []) lifetime.get(Number(p.user_id))!.approvedProjectCount++;
      for (const r of allRatings.data ?? []) lifetime.get(Number(r.user_id))!.ratings.push(r);
    }

    const leaderboard = scored.map((row, index) => {
      const user = users.get(row.userId);
      const life = lifetime.get(row.userId) ?? row.a;
      const badges = getAchievements({
        userId: row.userId,
        projectCount: life.approvedProjectCount,
        reviewCount: life.ratings.filter((r) => typeof r.review_text === "string" && r.review_text.trim()).length,
        hasOnChainReview: life.ratings.some((r) => typeof r.tx_hash === "string" && r.tx_hash.length > 0),
      })
        .filter((achievement) => achievement.earned)
        .map((achievement) => achievement.name);
      return {
        rank: index + 1,
        userId: row.userId,
        username: user?.username ?? `User #${row.userId}`,
        avatar_url: user?.avatar_url ?? null,
        xp: row.xp.total,
        breakdown: row.xp,
        badges,
      };
    });

    return Response.json(
      { range, leaderboard },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (err) {
    console.error("Leaderboard error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
