import { getAuthUser, hasMinRole } from "@/lib/auth";
import { projectsCol } from "@/lib/db";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(timestamp: number): string {
	return new Date(timestamp).toISOString().slice(0, 10);
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const auth = getAuthUser(request);
	if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const projectDocument = await projectsCol.ref.doc(id).get();
	if (!projectDocument.exists) {
		return Response.json({ error: "Project not found" }, { status: 404 });
	}

	const project = projectDocument.data()!;
	if (
		project.user_id !== auth.userId &&
		!hasMinRole(auth.role, "admin")
	) {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	const requestedDays = new URL(request.url).searchParams.get("days");
	const days = requestedDays === null ? DEFAULT_DAYS : Number(requestedDays);
	if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
		return Response.json(
			{ error: `days must be an integer between 1 and ${MAX_DAYS}` },
			{ status: 400 },
		);
	}

	const now = Date.now();
	const today = utcDay(now);
	const startDay = utcDay(now - (days - 1) * DAY_MS);
	const { data, error } = await getSupabase()
		.from("project_views_daily")
		.select("day, views")
		.eq("project_id", project.numericId)
		.gte("day", startDay)
		.lte("day", today)
		.order("day", { ascending: true });

	if (error) {
		console.error("Project analytics query failed:", error);
		if (error.code === "42P01" || error.code === "PGRST205") {
			return Response.json(
				{ error: "Daily project view tracking is not available yet" },
				{ status: 503 },
			);
		}
		return Response.json(
			{ error: "Unable to load project analytics" },
			{ status: 500 },
		);
	}

	const viewsByDay = new Map<string, number>();
	for (const row of data ?? []) {
		const day = String(row.day);
		const views = Number(row.views);
		if (!Number.isFinite(views) || views < 0) continue;
		viewsByDay.set(day, Math.floor(views));
	}

	const dailyViews = Array.from({ length: days }, (_, index) => {
		const day = utcDay(Date.parse(`${startDay}T00:00:00.000Z`) + index * DAY_MS);
		return { day, views: viewsByDay.get(day) ?? 0 };
	});
	const totalViews = dailyViews.reduce((total, entry) => total + entry.views, 0);

	return Response.json(
		{
			days,
			startDay,
			endDay: today,
			totalViews,
			averageViewsPerDay: totalViews / days,
			dailyViews,
		},
		{ headers: { "Cache-Control": "private, no-store" } },
	);
}
