import {financialSnapshotsCol, projectsCol} from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/financials/[projectId]/snapshots
 *
 * Returns the most recent financial snapshots for a project, ordered
 * oldest-first so the client can draw a left-to-right sparkline.
 *
 * Query params:
 *   limit  – number of snapshots to return (default 20, max 100)
 *
 * Response: { snapshots: Array<{ id, created_at, xlm_balance: number }> }
 *
 * Each item exposes the XLM balance extracted from snapshot_data.balances
 * (the native asset is listed as asset_type "native" in Stellar payloads).
 * If the project has no linked account or no snapshots the response is an
 * empty array — the UI renders a graceful empty state.
 */
export async function GET(
	request: Request,
	{params}: {params: Promise<{projectId: string}>},
) {
	const {projectId} = await params;

	// Validate project exists
	const projectDoc = await projectsCol.ref.doc(projectId).get();
	if (!projectDoc.exists) {
		return Response.json({error: "Project not found"}, {status: 404});
	}

	// Parse optional limit query param
	const url = new URL(request.url);
	const rawLimit = parseInt(url.searchParams.get("limit") ?? "20", 10);
	const limit = Number.isNaN(rawLimit)
		? 20
		: Math.min(Math.max(rawLimit, 1), 100);

	try {
		// Fetch the `limit` most recent snapshots, then reverse for oldest-first
		const snapshot = await financialSnapshotsCol.ref
			.where("project_id", "==", Number(projectId))
			.orderBy("created_at", "desc")
			.limit(limit)
			.get();

		const snapshots = snapshot.docs
			.map((doc) => {
				const row = doc.data();
				// snapshot_data is the JSONB payload stored by the stellar service
				// Shape: { balances: [{asset_type, asset_code, balance}], ... }
				const data =
					typeof row.snapshot_data === "object" && row.snapshot_data !== null
						? (row.snapshot_data as Record<string, unknown>)
						: {};

				const balances = Array.isArray(data.balances)
					? (data.balances as {asset_type?: string; asset_code?: string; balance?: string}[])
					: [];

				// Find the XLM (native) balance
				const nativeEntry = balances.find(
					(b) => b.asset_type === "native" || b.asset_code === "XLM",
				);
				const xlm_balance = nativeEntry
					? parseFloat(nativeEntry.balance ?? "0")
					: 0;

				return {
					id: row.id as number,
					created_at: row.created_at as string,
					xlm_balance,
				};
			})
			// Reverse so the array goes oldest → newest (left → right on the chart)
			.reverse();

		return Response.json({snapshots});
	} catch (err) {
		console.error("Snapshots fetch error:", err);
		return Response.json(
			{error: "Failed to fetch snapshots"},
			{status: 500},
		);
	}
}
