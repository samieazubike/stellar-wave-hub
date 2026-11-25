import {verifyApiKey} from "@/lib/api-keys";
import {listActiveJobs, parseJobFilters} from "@/lib/jobs-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const apiKey = await verifyApiKey(request);
	if (!apiKey) {
		return Response.json(
			{error: "A valid API key is required. Send it in the X-API-Key header."},
			{status: 401},
		);
	}

	try {
		const filters = parseJobFilters(new URL(request.url).searchParams);
		const jobs = await listActiveJobs(filters);
		return Response.json(
			{data: jobs},
			{headers: {"Cache-Control": "private, no-store"}},
		);
	} catch (error) {
		console.error("GET /api/v1/jobs error:", error);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
