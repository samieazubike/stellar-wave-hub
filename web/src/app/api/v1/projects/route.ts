import {verifyApiKey} from "@/lib/api-keys";
import {getSupabase} from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const apiKey = await verifyApiKey(request);
	if (!apiKey) {
		return Response.json(
			{error: "A valid API key is required. Send it in the X-API-Key header."},
			{status: 401},
		);
	}

	const url = new URL(request.url);
	const rawLimit = url.searchParams.get("limit");
	const rawPage = url.searchParams.get("page");
	const limit = rawLimit === null ? 20 : Number(rawLimit);
	const page = rawPage === null ? 1 : Number(rawPage);
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
		return Response.json({error: "limit must be an integer between 1 and 100"}, {status: 400});
	}
	if (!Number.isInteger(page) || page < 1) {
		return Response.json({error: "page must be a positive integer"}, {status: 400});
	}

	try {
		const offset = (page - 1) * limit;
		const {data, count, error} = await getSupabase()
			.from("projects")
			.select('"numericId",name,slug,description,category,tags,website_url,github_url,logo_url,created_at', {
				count: "exact",
			})
			.in("status", ["approved", "featured"])
			.order("created_at", {ascending: false})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		return Response.json(
			{
				data: (data ?? []).map((project) => ({
					...project,
					id: Number(project["numericId"]),
				})),
				pagination: {
					page,
					limit,
					total: count ?? 0,
					pages: Math.ceil((count ?? 0) / limit),
				},
			},
			{headers: {"Cache-Control": "private, no-store"}},
		);
	} catch (error) {
		console.error("GET /api/v1/projects error:", error);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
