import {projectsCol, usersCol, ratingsCol, nextId} from "@/lib/db";
import {getAuthUser} from "@/lib/auth";

import {getSupabase} from "@/lib/firebase";

import {parseJsonBody} from "@/lib/validation/parse-body";
import {createProjectSchema} from "@/lib/validation/schemas/projects";

import slugify from "slugify";
export const dynamic = "force-dynamic";

function buildTsQuery(search: string): string {
	return search
		.trim()
		.split(/\s+/)
		.map((term) => term.replace(/[':!*&|()]/g, "").trim())
		.filter(Boolean)
		.map((term) => `${term}:*`)
		.join(" & ");
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const category = url.searchParams.get("category");

		const rawSearch = url.searchParams.get("search")?.trim() || "";

		const search = url.searchParams.get("search")?.toLowerCase();
		const substantial = url.searchParams.get("substantial") === "true";

		const sort = url.searchParams.get("sort") || "newest";
		const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
		const limit = Math.min(
			50,
			Math.max(1, Number(url.searchParams.get("limit")) || 12),
		);
		const offset = (page - 1) * limit;
		const supabase = getSupabase();

		let countQuery = supabase
			.from("projects")
			.select("numericId", {count: "exact", head: true})
			.in("status", ["approved", "featured"]);

		let dataQuery = supabase
			.from("projects")
			.select("*")
			.in("status", ["approved", "featured"]);

		if (category) {
			countQuery = countQuery.eq("category", category);
			dataQuery = dataQuery.eq("category", category);
		}


		if (rawSearch) {
			const tsQuery = buildTsQuery(rawSearch);
			if (tsQuery) {
				countQuery = countQuery.textSearch("search_vector", tsQuery, {
					config: "simple",
					type: "plain",
				});
				dataQuery = dataQuery.textSearch("search_vector", tsQuery, {
					config: "simple",
					type: "plain",
				});
			} else {
				const pattern = `%${rawSearch.replace(/[%_]/g, "\\$&")}%`;
				countQuery = countQuery.or(
					`name.ilike.${pattern},description.ilike.${pattern},tags.ilike.${pattern},category.ilike.${pattern}`,
				);
				dataQuery = dataQuery.or(
					`name.ilike.${pattern},description.ilike.${pattern},tags.ilike.${pattern},category.ilike.${pattern}`,
				);
			}
		}

		if (substantial) {
			query = query.where("is_substantial", "==", true);
		}

		const snap = await query.get();
		let projects: Record<string, unknown>[] = snap.docs.map((d) => ({
			...d.data(),
			id: d.data().numericId,
		}));


		if (sort === "oldest") {
			dataQuery = dataQuery.order("created_at", {ascending: true});
		} else {
			dataQuery = dataQuery
				.order("featured", {ascending: false})
				.order("created_at", {ascending: false});
		}

		dataQuery = dataQuery.range(offset, offset + limit - 1);

		const [countResult, projectsResult, ratingsSnap] = await Promise.all([
			countQuery,
			dataQuery,
			ratingsCol.ref.get(),
		]);

		if (countResult.error) throw countResult.error;
		if (projectsResult.error) throw projectsResult.error;

		let projects: Record<string, unknown>[] = (projectsResult.data ?? []).map((p) => ({
			...p,
			id: p.numericId,
		}));

		// Fetch ratings for avg computation
		const ratingsByProject = new Map<number, number[]>();
		ratingsSnap.docs.forEach((d) => {
			const r = d.data();
			const pid = r.project_id as number;
			if (!ratingsByProject.has(pid)) ratingsByProject.set(pid, []);
			ratingsByProject.get(pid)!.push(r.score as number);
		});

		// Enrich with ratings + username
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
				const scores = ratingsByProject.get(p.id as number) || [];
				const avg_rating =
					scores.length > 0
						? scores.reduce((a, b) => a + b, 0) / scores.length
						: null;
				return {
					...p,
					username: uid ? userCache.get(uid) : null,
					avg_rating,
					rating_count: scores.length,
				};
			}),
		);

		if (sort === "top-rated") {
			projects = enriched.sort(
				(a, b) =>
					(((b.avg_rating as number) || 0) - ((a.avg_rating as number) || 0)) ||
					((b.featured as number) - (a.featured as number)) ||
					((b.created_at as string) > (a.created_at as string) ? 1 : -1),
			);
		} else {
			projects = enriched;
		}

		const total = countResult.count ?? projects.length;

		return Response.json({
			projects,
			pagination: {page, limit, total, pages: Math.ceil(total / limit)},
		});
	} catch (err) {
		console.error("List projects error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}

export async function POST(request: Request) {
	const auth = getAuthUser(request);
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
		return Response.json(
			{project: {...project, id: numericId}},
			{status: 201},
		);
	} catch (err) {
		console.error("Create project error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
