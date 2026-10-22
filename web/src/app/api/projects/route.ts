import {projectsCol, usersCol, ratingsCol, nextId} from "@/lib/db";
import {getAuthUser} from "@/lib/auth";
import {parseJsonBody} from "@/lib/validation/parse-body";
import {createProjectSchema} from "@/lib/validation/schemas/projects";
import {publicProjectCacheHeaders} from "@/lib/public-project-cache";
import {notifyMaintainersOfSubmission} from "@/lib/notifications";
import slugify from "slugify";
import {getSupabase} from "@/lib/firebase";
import {checkRateLimit, getClientIp, rateLimitExceededResponse} from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

// Rate limit: 5 project submissions per hour per user (falls back to IP when anonymous)
const SUBMIT_RATE_LIMIT = {limit: 5, windowMs: 60 * 60_000};

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const category = url.searchParams.get("category");
		const search = url.searchParams.get("search")?.toLowerCase();
		const substantial = url.searchParams.get("substantial") === "true";
		const sort = url.searchParams.get("sort") || "newest";
		const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
		const limit = Math.min(
			50,
			Math.max(1, Number(url.searchParams.get("limit")) || 12),
		);
		const now = Date.now();
		const DAY_MS = 24 * 60 * 60 * 1000;

		const supabase = getSupabase();
		let query = supabase
			.from("projects")
			.select("*", { count: "exact" })
			.in("status", ["approved", "featured"]);
		if (sort === "new-this-week") {
			query = query
				.gte("created_at", new Date(now - 7 * DAY_MS).toISOString())
				.order("created_at", { ascending: false });
		}

		if (category) {
			query = query.ilike("category", category);
		}

		if (substantial) {
			query = query.eq("is_substantial", true);
		}

		if (search && search.trim()) {
			const cleanSearch = search.replace(/[%_\,()]/g, " ").trim();
			if (cleanSearch) {
				query = query.or(
					`name.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,tags.ilike.%${cleanSearch}%`,
				);
			}
		}

		const { data, count, error } = await query;
		if (error) throw error;

		const projects: Record<string, unknown>[] = (data || []).map((row) => ({
			...row,
			id: row.numericId,
		}));

		// Fetch ratings for avg computation & rating velocity
		const ratingsSnap = await ratingsCol.ref.get();
		interface RatingItem {
			score: number;
			created_at: string;
		}
		const ratingsByProject = new Map<number, RatingItem[]>();
		ratingsSnap.docs.forEach((d) => {
			const r = d.data();
			const pid = r.project_id as number;
			if (!ratingsByProject.has(pid)) ratingsByProject.set(pid, []);
			ratingsByProject.get(pid)!.push({
				score: Number(r.score) || 0,
				created_at: (r.created_at as string) || "",
			});
		});

		const computeRatingVelocity = (items: RatingItem[]): number => {
			if (!items || items.length === 0) return 0;
			return items.reduce((total, item) => {
				const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0;
				// Age in days (clamped to >= 0)
				const ageInDays = itemTime > 0 ? Math.max(0, (now - itemTime) / DAY_MS) : 180;
				// Half-life recency decay: recent ratings dominate velocity
				const recency = 1 / Math.pow(1 + ageInDays / 30, 1.5);
				// Quality weight: higher star scores contribute proportionally
				const scoreFactor = Math.max(0.5, item.score / 5);
				return total + recency * scoreFactor;
			}, 0);
		};

		// Enrich with ratings + username + rating_velocity
		const userCache = new Map<number, string>();
		const enriched: Record<string, unknown>[] = await Promise.all(
			projects.map(async (p) => {
				const uid = p.user_id as number;
				if (uid && !userCache.has(uid)) {
					const uDoc = await usersCol.ref.doc(String(uid)).get();
					userCache.set(
						uid,
						uDoc.exists
							? (uDoc.data()!.username as string)
							: "unknown",
					);
				}
				const ratingItems = ratingsByProject.get(p.id as number) || [];
				const scores = ratingItems.map((r) => r.score);
				const avg_rating =
					scores.length > 0
						? scores.reduce((a, b) => a + b, 0) / scores.length
						: null;
				const rating_velocity = Number(computeRatingVelocity(ratingItems).toFixed(3));
				return {
					...p,
					username: uid ? userCache.get(uid) : null,
					avg_rating,
					rating_count: scores.length,
					rating_velocity,
				};
			}),
		);

		// Sort
		if (sort === "new-this-week") {
			// Sort strictly by created_at descending (newest first)
			enriched.sort((a, b) =>
				new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime(),
			);
		} else {
			enriched.sort((a, b) => {
				if (sort === "trending" || sort === "velocity") {
					const velA = (a.rating_velocity as number) || 0;
					const velB = (b.rating_velocity as number) || 0;
					if (velB !== velA) return velB - velA;
					const countA = (a.rating_count as number) || 0;
					const countB = (b.rating_count as number) || 0;
					if (countB !== countA) return countB - countA;
					const rateA = (a.avg_rating as number) || 0;
					const rateB = (b.avg_rating as number) || 0;
					if (rateB !== rateA) return rateB - rateA;
					return (b.created_at as string) > (a.created_at as string) ? 1 : -1;
				}
				if (sort === "oldest")
					return (a.created_at as string) < (b.created_at as string)
						? -1
						: 1;
				if (sort === "top-rated")
					return (
						((b.avg_rating as number) || 0) -
						((a.avg_rating as number) || 0)
					);
				if (sort === "most-reviewed")
					return (
						((b.rating_count as number) || 0) -
						((a.rating_count as number) || 0)
					);
				// newest — featured first, then by date desc
				if ((b.featured as number) !== (a.featured as number))
					return (b.featured as number) - (a.featured as number);
				return (b.created_at as string) > (a.created_at as string) ? 1 : -1;
			});
		}

		const total = count ?? enriched.length;
		const offset = (page - 1) * limit;
		const paged = enriched.slice(offset, offset + limit);

		return Response.json(
			{
				projects: paged,
				pagination: {page, limit, total, pages: Math.ceil(total / limit)},
			},
			{headers: publicProjectCacheHeaders},
		);
	} catch (err) {
		console.error("List projects error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}

export async function POST(request: Request) {
	const auth = getAuthUser(request);
	const rateLimitKey = auth
		? `projects-submit:user:${auth.userId}`
		: `projects-submit:ip:${getClientIp(request)}`;
	const rl = checkRateLimit(rateLimitKey, SUBMIT_RATE_LIMIT);
	if (!rl.allowed) return rateLimitExceededResponse(rl.retryAfterSeconds);

	if (!auth) return Response.json({error: "Unauthorized"}, {status: 401});

	const parsed = await parseJsonBody(request, createProjectSchema);
	if (!parsed.success) return parsed.response;

	const {
		name,
		description,
		category,
		stellar_account_id,
		stellar_contract_id,
		stellar_network,
		tags,
		website_url,
		github_url,
		github_repos,
		logo_url,
		research_images,
	} = parsed.data;

	try {

		let slug = slugify(name, {lower: true, strict: true});
		const existing = await projectsCol.ref
			.where("slug", "==", slug)
			.limit(1)
			.get();
		if (!existing.empty) slug = `${slug}-${Date.now()}`;

		const numericId = await nextId("projects");
		const now = new Date().toISOString();
		const project = {
			numericId,
			name,
			slug,
			description,
			category,
			status: "submitted",
			stellar_account_id: stellar_account_id || null,
			stellar_contract_id: stellar_contract_id || null,
			stellar_network: stellar_network === "testnet" ? "testnet" : "mainnet",
			tags: tags || null,
			website_url: website_url || null,
			github_url: github_url || null,
			github_repos: Array.isArray(github_repos) ? github_repos : [],
			logo_url: logo_url || null,
			research_images: Array.isArray(research_images) ? research_images : [],
			user_id: auth.userId,
			featured: 0,
			rejection_reason: null,
			created_at: now,
			updated_at: now,
		};

		await projectsCol.ref.doc(String(numericId)).set(project);

		// Notify maintainers of the new submission (fire-and-forget)
		// Notification failure must not block the submission response
		notifyMaintainersOfSubmission({
			numericId,
			name,
			category,
			user_id: auth.userId,
		}).catch((err) =>
			console.error("Failed to send maintainer notifications:", err)
		);

		return Response.json(
			{project: {...project, id: numericId}},
			{status: 201},
		);
	} catch (err) {
		console.error("Create project error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
