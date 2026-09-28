import {usersCol} from "@/lib/db";
import {getSupabase} from "@/lib/firebase";
import {getAuthUser, VALID_CATEGORIES} from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	{params}: {params: Promise<{id: string}>},
) {
	const auth = getAuthUser(request);
	if (!auth || auth.role !== "admin") {
		return Response.json({error: "Forbidden"}, {status: 403});
	}

	const {id} = await params;
	const doc = await usersCol.ref.doc(id).get();
	if (!doc.exists) {
		return Response.json({error: "User not found"}, {status: 404});
	}

	const supabase = getSupabase();
	const {data, error} = await supabase
		.from("maintainer_categories")
		.select("category")
		.eq("userId", Number(id))
		.order("category", {ascending: true});

	if (error) throw error;

	const user = doc.data()!;
	return Response.json({
		user: {
			id: user.numericId,
			username: user.username,
			email: user.email,
			role: user.role,
		},
		categories: data?.map((row) => row.category) ?? [],
	});
}

export async function PUT(
	request: Request,
	{params}: {params: Promise<{id: string}>},
) {
	const auth = getAuthUser(request);
	if (!auth || auth.role !== "admin") {
		return Response.json({error: "Forbidden"}, {status: 403});
	}

	const {id} = await params;
	const doc = await usersCol.ref.doc(id).get();
	if (!doc.exists) {
		return Response.json({error: "User not found"}, {status: 404});
	}

	const user = doc.data()!;
	if (user.role !== "maintainer") {
		return Response.json(
			{error: "Can only assign categories to maintainers"},
			{status: 400},
		);
	}

	try {
		const body = await request.json();
		const categories = body.categories;

		if (!Array.isArray(categories)) {
			return Response.json(
				{error: "Categories must be an array"},
				{status: 400},
			);
		}

		const dedupedCategories = [...new Set(categories)];
		const invalidCategories = dedupedCategories.filter(
			(category) => !VALID_CATEGORIES.includes(category as never),
		);

		if (invalidCategories.length > 0) {
			return Response.json(
				{error: `Invalid categories: ${invalidCategories.join(", ")}`},
				{status: 400},
			);
		}

		const supabase = getSupabase();
		const {error: deleteError} = await supabase
			.from("maintainer_categories")
			.delete()
			.eq("userId", Number(id));

		if (deleteError) throw deleteError;

		if (dedupedCategories.length > 0) {
			const now = new Date().toISOString();
			const {error: insertError} = await supabase
				.from("maintainer_categories")
				.insert(
					dedupedCategories.map((category) => ({
						userId: Number(id),
						category,
						created_at: now,
					})),
				);

			if (insertError) throw insertError;
		}

		return Response.json({success: true, categories: dedupedCategories});
	} catch (err) {
		console.error("Set categories error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
