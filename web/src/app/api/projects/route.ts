import {projectsCol, usersCol, ratingsCol, nextId} from "@/lib/db";
import {getAuthUser} from "@/lib/auth";
import slugify from "slugify";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const category = url.searchParams.get("category");
		const search = url.searchParams.get("search")?.toLowerCase();
		const sort = url.searchParams.get("sort") || "newest";
		const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
		const limit = Math.min(
			50,
			Math.max(1, Number(url.searchParams.get("limit")) || 12),
		);

		// Query approved/featured projects
		let query = projectsCol.ref.where("status", "in", [
			"approved",
			"featured",
		]);

		if (category) {
			query = query.where("category", "==", category);
		}

		const snap = await query.get();
		let projects: Record<string, unknown>[] = snap.docs.map((d) => ({
			...d.data(),
			id: d.data().numericId,
		}));

		// Client-side search filtering (Firestore doesn't support LIKE)
		if (search) {
			projects = projects.filter(
				(p) =>
					(p.name as string)?.toLowerCase().includes(search) ||
					(p.description as string)?.toLowerCase().includes(search) ||
					(p.tags as string)?.toLowerCase().includes(search),
			);
		}

		// Fetch ratings for avg computation
		const ratingsSnap = await ratingsCol.ref.get();
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

		// Sort
		enriched.sort((a, b) => {
			if (sort === "oldest")
				return (a.created_at as string) < (b.created_at as string)
					? -1
					: 1;
			if (sort === "top-rated")
				return (
					((b.avg_rating as number) || 0) -
					((a.avg_rating as number) || 0)
				);
			// newest — featured first, then by date desc
			if ((b.featured as number) !== (a.featured as number))
				return (b.featured as number) - (a.featured as number);
			return (b.created_at as string) > (a.created_at as string) ? 1 : -1;
		});

		const total = enriched.length;
		const offset = (page - 1) * limit;
		const paged = enriched.slice(offset, offset + limit);

		return Response.json({
			projects: paged,
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

	try {
		const body = await request.json();
		const {
			name,
			description,
			category,
			stellar_account_id,
			stellar_contract_id,
			tags,
			website_url,
			github_url,
			logo_url,
			research_images,
		} = body;

		if (!name || !description || !category) {
			return Response.json(
				{error: "Name, description, and category are required"},
				{status: 400},
			);
		}

		let slug = slugify(name, {lower: true, strict: true});
		const existing = await projectsCol.ref
			.where("slug", "==", slug)
			.limit(1)
			.get();
		if (!existing.empty) slug = `${slug}-${Date.now()}`;

		const numericId = await nextId("projects");
		const now = new Date().toISOString();
		const project: Record<string, unknown> = {
			numericId,
			name,
			slug,
			description,
			category,
			status: "submitted",
			stellar_account_id: stellar_account_id || null,
			stellar_contract_id: stellar_contract_id || null,
			tags: tags || null,
			website_url: website_url || null,
			github_url: github_url || null,
			logo_url: logo_url || null,
			user_id: auth.userId,
			featured: 0,
			rejection_reason: null,
			created_at: now,
			updated_at: now,
		};

		// Include research_images if provided; fall back gracefully if column doesn't exist
		const projectWithImages = {
			...project,
			research_images: Array.isArray(research_images) ? research_images : [],
		};

		try {
			await projectsCol.ref.doc(String(numericId)).set(projectWithImages);
		} catch (colErr: unknown) {
			// If the column doesn't exist in the DB, retry without research_images
			const msg = colErr instanceof Error ? colErr.message : String(colErr);
			if (msg.includes("research_images") || msg.includes("column")) {
				await projectsCol.ref.doc(String(numericId)).set(project);
			} else {
				throw colErr;
			}
		}

		return Response.json(
			{project: {...projectWithImages, id: numericId}},
			{status: 201},
		);
	} catch (err) {
		console.error("Create project error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
