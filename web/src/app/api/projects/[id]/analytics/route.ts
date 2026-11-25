import {getAuthUser} from "@/lib/auth";
import {isPro} from "@/lib/pro";
import {getSupabase} from "@/lib/firebase";

export const dynamic = "force-dynamic";

const MAX_ANALYTICS_DAYS = 90;
const FREE_ANALYTICS_DAYS = 7;

export async function GET(
	request: Request,
	{params}: {params: Promise<{id: string}>},
) {
	const auth = getAuthUser(request);
	if (!auth) return Response.json({error: "Unauthorized"}, {status: 401});

	const {id} = await params;
	if (!id || id.length > 200) {
		return Response.json({error: "Invalid project ID"}, {status: 400});
	}

	try {
		const supabase = getSupabase();
		const isNumericId = /^\d+$/.test(id);
		const numericId = Number(id);
		if (isNumericId && (!Number.isSafeInteger(numericId) || numericId <= 0)) {
			return Response.json({error: "Invalid project ID"}, {status: 400});
		}

		const {data: project, error: projectError} = await supabase
			.from("projects")
			.select('"numericId",user_id,name,slug,pro_until')
			.eq(isNumericId ? "numericId" : "slug", isNumericId ? numericId : id)
			.maybeSingle();

		if (projectError) throw projectError;
		if (!project) return Response.json({error: "Project not found"}, {status: 404});
		if (Number(project.user_id) !== auth.userId) {
			return Response.json({error: "Forbidden"}, {status: 403});
		}
		const projectId = Number(project["numericId"]);
		if (!Number.isSafeInteger(projectId) || projectId <= 0) {
			throw new Error("Project has an invalid numeric ID");
		}

		const projectIsPro = isPro(project);
		const requestedDaysParam = new URL(request.url).searchParams.get("days");
		let requestedDays = requestedDaysParam === null
			? (projectIsPro ? MAX_ANALYTICS_DAYS : FREE_ANALYTICS_DAYS)
			: Number(requestedDaysParam);
		if (!Number.isInteger(requestedDays) || requestedDays < 1) {
			return Response.json({error: "days must be a positive integer"}, {status: 400});
		}
		requestedDays = Math.min(requestedDays, MAX_ANALYTICS_DAYS);
		const days = projectIsPro
			? requestedDays
			: Math.min(requestedDays, FREE_ANALYTICS_DAYS);
		const upgradeRequired = !projectIsPro && requestedDays > FREE_ANALYTICS_DAYS;

		const today = new Date();
		const start = new Date(Date.UTC(
			today.getUTCFullYear(),
			today.getUTCMonth(),
			today.getUTCDate() - days + 1,
		));
		const startDay = start.toISOString().slice(0, 10);
		const endDay = today.toISOString().slice(0, 10);
		const startTimestamp = start.toISOString();
		const endTimestamp = today.toISOString();

		const {data: viewRows, error: viewsError} = await supabase
			.from("project_views_daily")
			.select("day,views")
			.eq("project_id", projectId)
			.gte("day", startDay)
			.lte("day", endDay)
			.order("day", {ascending: true});
		if (viewsError) throw viewsError;

		const viewsByDay = new Map(
			(viewRows ?? []).map((row) => [String(row.day), Number(row.views)]),
		);
		const dailyViews: {day: string; views: number}[] = [];
		for (let offset = 0; offset < days; offset += 1) {
			const day = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000)
				.toISOString()
				.slice(0, 10);
			dailyViews.push({day, views: viewsByDay.get(day) ?? 0});
		}

		const totalViews = dailyViews.reduce((total, entry) => total + entry.views, 0);
		let referrers: {host: string; views: number}[] = [];
		let conversions: {tips: number; ratings: number; tipRate: number; ratingRate: number} | null = null;

		if (projectIsPro) {
			const [
				{data: referrerRows, error: referrersError},
				{count: tipCount, error: tipsError},
				{count: ratingCount, error: ratingsError},
			] = await Promise.all([
				supabase
					.from("project_views_referrers_daily")
					.select("referrer_host,views")
					.eq("project_id", projectId)
					.gte("day", startDay)
					.lte("day", endDay),
				supabase
					.from("payments")
					.select("id", {count: "exact", head: true})
					.eq("project_id", projectId)
					.eq("product", "tip")
					.gte("created_at", startTimestamp)
					.lte("created_at", endTimestamp),
				supabase
					.from("ratings")
					.select('"numericId"', {count: "exact", head: true})
					.eq("project_id", projectId)
					.gte("created_at", startTimestamp)
					.lte("created_at", endTimestamp),
			]);

			if (referrersError) throw referrersError;
			if (tipsError) throw tipsError;
			if (ratingsError) throw ratingsError;

			const viewsByHost = new Map<string, number>();
			for (const row of referrerRows ?? []) {
				const host = String(row.referrer_host);
				viewsByHost.set(host, (viewsByHost.get(host) ?? 0) + Number(row.views));
			}
			referrers = [...viewsByHost.entries()]
				.map(([host, views]) => ({host, views}))
				.sort((a, b) => b.views - a.views);

			const tips = tipCount ?? 0;
			const ratings = ratingCount ?? 0;
			conversions = {
				tips,
				ratings,
				tipRate: totalViews > 0 ? (tips / totalViews) * 100 : 0,
				ratingRate: totalViews > 0 ? (ratings / totalViews) * 100 : 0,
			};
		}

		return Response.json(
			{
				project: {
					id: Number(project["numericId"]),
					name: project.name,
					slug: project.slug,
				},
				isPro: projectIsPro,
				days,
				upgradeRequired,
				dailyViews,
				totalViews,
				referrers,
				conversions,
			},
			{headers: {"Cache-Control": "private, no-store"}},
		);
	} catch (error) {
		console.error("Project analytics error:", error);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
