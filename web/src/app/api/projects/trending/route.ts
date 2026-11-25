import {usersCol, ratingsCol} from "@/lib/db";
import {getSupabase} from "@/lib/firebase";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const TRENDING_WINDOW_DAYS = 7;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 50;

interface RatingStats {
	recentCount: number;
	recentScoreSum: number;
	totalCount: number;
	totalScoreSum: number;
}

interface TrendingProject extends Record<string, unknown> {
	id: number;
	username: string | null;
	avg_rating: number | null;
	rating_count: number;
	recent_rating_count: number;
	recent_avg_rating: number | null;
}

const emptyStats = (): RatingStats => ({
	recentCount: 0,
	recentScoreSum: 0,
	totalCount: 0,
	totalScoreSum: 0,
});

function ratingTimestamp(createdAt: unknown): number {
	if (typeof createdAt !== "string" || !createdAt) return 0;
	const parsed = Date.parse(createdAt);
	return Number.isNaN(parsed) ? 0 : parsed;
}

function average(sum: number, count: number): number | null {
	return count > 0 ? sum / count : null;
}

/**
 * Orders projects that have recent activity by the number of ratings received
 * in the window. Ties are broken by the project's average score, then by the
 * average score of the recent ratings, rating volume, and finally recency.
 */
function compareTrending(a: TrendingProject, b: TrendingProject): number {
	if (b.recent_rating_count !== a.recent_rating_count) {
		return b.recent_rating_count - a.recent_rating_count;
	}

	const avgA = a.avg_rating ?? 0;
	const avgB = b.avg_rating ?? 0;
	if (avgB !== avgA) return avgB - avgA;

	const recentAvgA = a.recent_avg_rating ?? 0;
	const recentAvgB = b.recent_avg_rating ?? 0;
	if (recentAvgB !== recentAvgA) return recentAvgB - recentAvgA;

	if (b.rating_count !== a.rating_count) {
		return b.rating_count - a.rating_count;
	}

	return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
}

/** Top-rated fallback used when no project has been rated in the window. */
function compareTopRated(a: TrendingProject, b: TrendingProject): number {
	const avgA = a.avg_rating ?? 0;
	const avgB = b.avg_rating ?? 0;
	if (avgB !== avgA) return avgB - avgA;

	if (b.rating_count !== a.rating_count) {
		return b.rating_count - a.rating_count;
	}

	return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const limit = Math.min(
			MAX_LIMIT,
			Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
		);

		const now = Date.now();
		const windowStart = now - TRENDING_WINDOW_DAYS * DAY_MS;

		// Aggregate every rating once so both the 7-day window and the all-time
		// average (used as the tie-breaker) come from the same snapshot.
		const ratingsSnap = await ratingsCol.ref.get();
		const statsByProject = new Map<number, RatingStats>();

		ratingsSnap.docs.forEach((doc) => {
			const rating = doc.data();
			const projectId = Number(rating.project_id);
			if (!Number.isFinite(projectId)) return;

			const score = Number(rating.score) || 0;
			const createdAt = ratingTimestamp(rating.created_at);

			const stats = statsByProject.get(projectId) ?? emptyStats();
			stats.totalCount += 1;
			stats.totalScoreSum += score;

			if (createdAt >= windowStart) {
				stats.recentCount += 1;
				stats.recentScoreSum += score;
			}

			statsByProject.set(projectId, stats);
		});

		const supabase = getSupabase();
		const {data, error} = await supabase
			.from("projects")
			.select("*")
			.in("status", ["approved", "featured"]);
		if (error) throw error;

		const projects: TrendingProject[] = (data || []).map((row) => {
			const id = Number(row.numericId);
			const stats = statsByProject.get(id) ?? emptyStats();
			return {
				...row,
				id,
				username: null,
				avg_rating: average(stats.totalScoreSum, stats.totalCount),
				rating_count: stats.totalCount,
				recent_rating_count: stats.recentCount,
				recent_avg_rating: average(stats.recentScoreSum, stats.recentCount),
			};
		});

		const recentRatingsTotal = projects.reduce(
			(total, project) => total + project.recent_rating_count,
			0,
		);
		const hasRecentActivity = recentRatingsTotal > 0;
		const ranked = hasRecentActivity
			? projects
					.filter((project) => project.recent_rating_count > 0)
					.sort(compareTrending)
			: projects.sort(compareTopRated);

		const selected = ranked.slice(0, limit);

		const userCache = new Map<number, string>();
		for (const project of selected) {
			const uid = Number(project.user_id);
			if (!Number.isFinite(uid) || uid <= 0) continue;

			if (!userCache.has(uid)) {
				const userDoc = await usersCol.ref.doc(String(uid)).get();
				userCache.set(
					uid,
					userDoc.exists
						? (userDoc.data()!.username as string) || "unknown"
						: "unknown",
				);
			}
			project.username = userCache.get(uid) ?? null;
		}

		return Response.json({
			projects: selected,
			meta: {
				window_days: TRENDING_WINDOW_DAYS,
				limit,
				fallback: !hasRecentActivity,
				recent_ratings: recentRatingsTotal,
			},
		});
	} catch (err) {
		console.error("Trending projects error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
