import {projectsCol} from "@/lib/db";
import {getContractInvocations} from "@/lib/stellarService";
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
		const operations = await getContractInvocations(stellarAccountId);
		return Response.json({operations});
	} catch (err) {
		console.error("Contract ops error:", err);
		return Response.json(
			{error: "Failed to fetch contract operations from Stellar"},
			{status: 502},
		);
	}
}
