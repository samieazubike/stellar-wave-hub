import {projectsCol, financialSnapshotsCol} from "@/lib/db";
import {getAccountSummary} from "@/lib/stellarService";
export const dynamic = "force-dynamic";

export async function GET(
	_request: Request,
	{params}: {params: Promise<{projectId: string}>},
) {
	const {projectId} = await params;
	const doc = await projectsCol.ref.doc(projectId).get();

	if (!doc.exists)
		return Response.json({error: "Project not found"}, {status: 404});
	const project = doc.data()!;
	const stellarAccountId =
		typeof project.stellar_account_id === "string"
			? project.stellar_account_id
			: null;
	if (!stellarAccountId) {
		return Response.json(
			{error: "No Stellar account linked"},
			{status: 400},
		);
	}

	try {
		const summary = await getAccountSummary(stellarAccountId);
		const snapshots = await financialSnapshotsCol.ref
			.where("project_id", "==", project.numericId)
			.orderBy("created_at", "asc")
			.limit(30)
			.get();
		return Response.json({
			project: {id: project.numericId, name: project.name},
			summary,
			snapshots: snapshots.docs.map((snapshot) => ({
				created_at: snapshot.data().created_at,
				balances: snapshot.data().snapshot_data?.balances ?? [],
			})),
		});
	} catch (err) {
		console.error("Financial summary error:", err);
		return Response.json(
			{error: "Failed to fetch account data from Stellar"},
			{status: 502},
		);
	}
}
