import {projectsCol, usersCol, ratingsCol} from "@/lib/db";
import {getSupabase} from "@/lib/firebase";
import {publicProjectCacheHeaders} from "@/lib/public-project-cache";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 12;
const CATEGORY_MATCH_WEIGHT = 3;
const SHARED_TAG_WEIGHT = 1;

interface RatingStats {
	count: number;
	sum: number;
}

interface SimilarProject extends Record<string, unknown> {
	id: number;
	slug: string;
	username: string | null;
	avg_rating: number | null;
	rating_count: number;
	similarity_score: number;
}

function normalizeCategory(value: unknown): string {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function parseTags(value: unknown): Set<string> {
	if (typeof value !== "string" || !value.trim()) return new Set();
	return new Set(
		value
			.split(",")
			.map((tag) => tag.trim().toLowerCase())
			.filter(Boolean),
	);
}

function countSharedTags(a: Set<string>, b: Set<string>): number {
	let shared = 0;
	for (const tag of a) {
		if (b.has(tag)) shared += 1;
	}
	return shared;
}

export async function GET(
	request: Request,
	{params}: {params: Promise<{id: string}>},
) {
	try {
		const {id} = await params;
		const url = new URL(request.url);
		const limit = Math.min(
			MAX_LIMIT,
			Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
		);

		// Lookup target project by numeric ID or slug
		const isNumeric = /^\d+$/.test(id);
		let currentProject: Record<string, unknown> | null = null;

		if (isNumeric) {
			const doc = await projectsCol.ref.doc(id).get();
			if (doc.exists) {
				const data = doc.data()!;
				currentProject = {...data, id: Number(data.numericId ?? id)};
			}
		} else {
			const snap = await projectsCol.ref.where("slug", "==", id).limit(1).get();
			if (!snap.empty) {
				const data = snap.docs[0].data();
				currentProject = {...data, id: Number(data.numericId)};
			}
		}

		if (!currentProject) {
			return Response.json({error: "Project not found"}, {status: 404});
		}

		const currentId = Number(currentProject.id);
		const currentCategory = normalizeCategory(currentProject.category);
		const currentTags = parseTags(currentProject.tags);

		const supabase = getSupabase();
		const {data: rows, error} = await supabase
			.from("projects")
			.select("*")
			.in("status", ["approved", "featured"]);
		if (error) throw error;

		// Aggregate ratings once for tie-breaking and card display
		const ratingsSnap = await ratingsCol.ref.get();
		const statsByProject = new Map<number, RatingStats>();
		ratingsSnap.docs.forEach((doc) => {
			const rating = doc.data();
			const projectId = Number(rating.project_id);
			if (!Number.isFinite(projectId)) return;
			const score = Number(rating.score) || 0;
			const stats = statsByProject.get(projectId) ?? {count: 0, sum: 0};
			stats.count += 1;
			stats.sum += score;
			statsByProject.set(projectId, stats);
		});

		const candidates: SimilarProject[] = [];
		for (const row of rows || []) {
			const candidateId = Number(row.numericId);
			if (candidateId === currentId) continue;

			const candidateCategory = normalizeCategory(row.category);
			const categoryMatch =
				Boolean(currentCategory) && candidateCategory === currentCategory;
			const sharedTags = countSharedTags(currentTags, parseTags(row.tags));
			const similarityScore =
				(categoryMatch ? CATEGORY_MATCH_WEIGHT : 0) +
				sharedTags * SHARED_TAG_WEIGHT;

			if (similarityScore <= 0) continue;

			const stats = statsByProject.get(candidateId);
			candidates.push({
				...row,
				id: candidateId,
				slug: String(row.slug ?? ""),
				username: null,
				avg_rating: stats && stats.count > 0 ? stats.sum / stats.count : null,
				rating_count: stats?.count ?? 0,
				similarity_score: similarityScore,
			});
		}

		candidates.sort((a, b) => {
			if (b.similarity_score !== a.similarity_score) {
				return b.similarity_score - a.similarity_score;
			}
			const avgA = a.avg_rating ?? 0;
			const avgB = b.avg_rating ?? 0;
			if (avgB !== avgA) return avgB - avgA;
			if (b.rating_count !== a.rating_count) {
				return b.rating_count - a.rating_count;
			}
			return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
		});

		const selected = candidates.slice(0, limit);

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

		return Response.json(
			{projects: selected},
			{headers: publicProjectCacheHeaders},
		);
	} catch (err) {
		console.error("Similar projects error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
