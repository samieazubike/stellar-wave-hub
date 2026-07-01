import {getAuthUser} from "@/lib/auth";
import {
	listMaintainerAssignments,
	setMaintainerCategories,
} from "@/lib/maintainerCategories";
import {PROJECT_CATEGORIES} from "@/lib/categories";

export const dynamic = "force-dynamic";

function requireAdmin(request: Request) {
	const auth = getAuthUser(request);
	return auth?.role === "admin" ? auth : null;
}

export async function GET(request: Request) {
	if (!requireAdmin(request)) {
		return Response.json({error: "Forbidden"}, {status: 403});
	}

	try {
		const maintainers = await listMaintainerAssignments();
		return Response.json({maintainers, categories: PROJECT_CATEGORIES});
	} catch (err) {
		console.error("List maintainer category assignments error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}

export async function PUT(request: Request) {
	if (!requireAdmin(request)) {
		return Response.json({error: "Forbidden"}, {status: 403});
	}

	try {
		const body = await request.json();
		const maintainerId = Number(body.maintainerId);

		if (!Number.isInteger(maintainerId)) {
			return Response.json(
				{error: "Valid maintainerId is required"},
				{status: 400},
			);
		}

		const categories = await setMaintainerCategories(
			maintainerId,
			body.categories,
		);

		return Response.json({maintainerId, categories});
	} catch (err) {
		if (err instanceof Error && err.message === "Maintainer not found") {
			return Response.json({error: err.message}, {status: 404});
		}

		console.error("Update maintainer category assignments error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
