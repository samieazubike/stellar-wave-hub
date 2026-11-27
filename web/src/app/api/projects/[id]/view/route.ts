import {projectsCol} from "@/lib/db";
import {getSupabase} from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function POST(
	request: Request,
	{params}: {params: Promise<{id: string}>},
) {
	const {id} = await params;
	if (!/^\d+$/.test(id)) {
		return Response.json({error: "Invalid project ID"}, {status: 400});
	}

	const projectId = Number(id);
	if (!Number.isSafeInteger(projectId) || projectId <= 0) {
		return Response.json({error: "Invalid project ID"}, {status: 400});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({error: "Invalid request body"}, {status: 400});
	}

	const referrerHost =
		body && typeof body === "object" && "referrerHost" in body
			? body.referrerHost
			: null;
	if (
		typeof referrerHost !== "string" ||
		referrerHost.length > 253 ||
		(referrerHost !== "direct" &&
			(!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(referrerHost) ||
				referrerHost.includes("..")))
	) {
		return Response.json({error: "Invalid referrer host"}, {status: 400});
	}

	try {
		const project = await projectsCol.ref.doc(String(projectId)).get();
		if (!project.exists) {
			return Response.json({error: "Project not found"}, {status: 404});
		}

		const {error} = await getSupabase().rpc("increment_project_view", {
			p_project_id: projectId,
			p_referrer_host: referrerHost,
		});
		if (error) throw error;

		return Response.json({success: true}, {headers: {"Cache-Control": "no-store"}});
	} catch (error) {
		console.error("Project view tracking error:", error);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
