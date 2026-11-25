import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function escapeCsv(value: unknown): string {
	let text =
		value === null || value === undefined
			? ""
			: String(value);

	if (/^[=+\-@]/.test(text) || /^[\t\r]/.test(text)) {
		text = `'${text}`;
	}

	return `"${text.replace(/"/g, '""')}"`;
}

function isValidDate(value: string): boolean {
	if (!DATE_PATTERN.test(value)) return false;
	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
	const auth = getAuthUser(request);
	if (!auth || !hasMinRole(auth.role, "admin")) {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from")?.trim() || "";
	const to = searchParams.get("to")?.trim() || "";
	const product = searchParams.get("product")?.trim() || "";

	if (from && !isValidDate(from)) {
		return Response.json({ error: "Invalid from date" }, { status: 400 });
	}
	if (to && !isValidDate(to)) {
		return Response.json({ error: "Invalid to date" }, { status: 400 });
	}
	if (from && to && from > to) {
		return Response.json({ error: "from must be on or before to" }, { status: 400 });
	}

	try {
		const supabase = getSupabase();
		let query = supabase
			.from("payments")
			.select("*")
			.order("created_at", { ascending: true });

		if (from) {
			query = query.gte("created_at", `${from}T00:00:00.000Z`);
		}
		if (to) {
			query = query.lte("created_at", `${to}T23:59:59.999Z`);
		}
		if (product && product !== "all") {
			query = query.eq("product", product);
		}

		const rows: Record<string, unknown>[] = [];
		for (let fromRow = 0; ; fromRow += PAGE_SIZE) {
			const { data, error } = await query.range(fromRow, fromRow + PAGE_SIZE - 1);
			if (error) throw error;
			if (!data?.length) break;
			rows.push(...data);
			if (data.length < PAGE_SIZE) break;
		}

		const userIds = Array.from(
			new Set(rows.map((row) => Number(row.user_id)).filter(Number.isFinite)),
		);
		const projectIds = Array.from(
			new Set(rows.map((row) => Number(row.project_id)).filter(Number.isFinite)),
		);

		const [usersResult, projectsResult] = await Promise.all([
			userIds.length
				? supabase
						.from("users")
						.select("numericId,username,email")
						.in("numericId", userIds)
				: Promise.resolve({ data: [], error: null }),
			projectIds.length
				? supabase
						.from("projects")
						.select("numericId,name,slug")
						.in("numericId", projectIds)
				: Promise.resolve({ data: [], error: null }),
		]);

		if (usersResult.error) throw usersResult.error;
		if (projectsResult.error) throw projectsResult.error;

		const usersById = new Map(
			(usersResult.data || []).map((row) => [Number(row.numericId), row]),
		);
		const projectsById = new Map(
			(projectsResult.data || []).map((row) => [Number(row.numericId), row]),
		);

		const headers = [
			"id",
			"created_at",
			"product",
			"tx_hash",
			"amount",
			"duration_days",
			"network",
			"user_id",
			"username",
			"user_email",
			"project_id",
			"project_name",
			"project_slug",
			"source_address",
			"destination_address",
		];

		const csvRows = rows.map((row) => {
			const user = usersById.get(Number(row.user_id));
			const project = projectsById.get(Number(row.project_id));
			return [
				row.id,
				row.created_at,
				row.product,
				row.tx_hash,
				row.amount,
				row.duration_days,
				row.network,
				row.user_id,
				user?.username,
				user?.email,
				row.project_id,
				project?.name,
				project?.slug,
				row.source_address,
				row.destination_address,
			];
		});

		const csv =
			"\uFEFF" +
			[headers, ...csvRows]
				.map((row) => row.map((value) => escapeCsv(value)).join(","))
				.join("\r\n") +
			"\r\n";

		const suffix =
			from || to
				? `_${from || "start"}_${to || "present"}`
				: "_all";

		return new Response(csv, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="payments${suffix}.csv"`,
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Admin payments CSV error:", error);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
}
