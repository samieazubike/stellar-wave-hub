import {getSupabase} from "@/lib/firebase";
import {
	PROJECT_CATEGORY_VALUES,
	isProjectCategory,
	normalizeCategory,
} from "@/lib/categories";
import {canReviewProjects} from "@/lib/rbac";

type AuthUser = {
	userId: number;
	role: string;
};

export type MaintainerAssignment = {
	id: number;
	username: string;
	email: string | null;
	categories: string[];
};

export function sanitizeMaintainerCategories(categories: unknown): string[] {
	if (!Array.isArray(categories)) return [];

	return Array.from(
		new Set(
			categories
				.filter((category): category is string => typeof category === "string")
				.map(normalizeCategory)
				.filter(isProjectCategory),
		),
	);
}

export async function getMaintainerCategories(
	maintainerId: number,
): Promise<string[]> {
	const supabase = getSupabase();
	const {data, error} = await supabase
		.from("maintainer_categories")
		.select("category")
		.eq("maintainer_id", maintainerId);

	if (error) throw error;

	return sanitizeMaintainerCategories(
		(data ?? []).map((row) => row.category as string),
	);
}

export async function canModerateCategory(
	auth: AuthUser,
	category: string,
): Promise<boolean> {
	if (auth.role === "admin") return true;
	if (!canReviewProjects(auth.role)) return false;

	const assignedCategories = await getMaintainerCategories(auth.userId);
	return assignedCategories.includes(normalizeCategory(category));
}

export async function listMaintainerAssignments(): Promise<
	MaintainerAssignment[]
> {
	const supabase = getSupabase();

	const [
		{data: maintainers, error: maintainersError},
		{data: assignments, error: assignmentsError},
	] = await Promise.all([
		supabase
			.from("users")
			.select("*")
			.eq("role", "maintainer")
			.order("username", {ascending: true}),
		supabase
			.from("maintainer_categories")
			.select("maintainer_id, category")
			.order("category", {ascending: true}),
	]);

	if (maintainersError) throw maintainersError;
	if (assignmentsError) throw assignmentsError;

	const categoriesByMaintainer = new Map<number, string[]>();
	for (const assignment of assignments ?? []) {
		const maintainerId = Number(assignment.maintainer_id);
		if (!categoriesByMaintainer.has(maintainerId)) {
			categoriesByMaintainer.set(maintainerId, []);
		}
		categoriesByMaintainer
			.get(maintainerId)!
			.push(normalizeCategory(assignment.category as string));
	}

	return (maintainers ?? []).map((maintainer) => {
		const id = Number(maintainer.numericId);
		return {
			id,
			username: maintainer.username as string,
			email: (maintainer.email as string | null) ?? null,
			categories: sanitizeMaintainerCategories(
				categoriesByMaintainer.get(id) ?? [],
			),
		};
	});
}

export async function setMaintainerCategories(
	maintainerId: number,
	categories: string[],
): Promise<string[]> {
	const supabase = getSupabase();
	const normalizedCategories = sanitizeMaintainerCategories(categories);

	const {data: maintainer, error: userError} = await supabase
		.from("users")
		.select("*")
		.eq("numericId", maintainerId)
		.maybeSingle();

	if (userError) throw userError;
	if (!maintainer || maintainer.role !== "maintainer") {
		throw new Error("Maintainer not found");
	}

	const {error: deleteError} = await supabase
		.from("maintainer_categories")
		.delete()
		.eq("maintainer_id", maintainerId);

	if (deleteError) throw deleteError;

	if (normalizedCategories.length > 0) {
		const {error: insertError} = await supabase
			.from("maintainer_categories")
			.insert(
				normalizedCategories.map((category) => ({
					maintainer_id: maintainerId,
					category,
				})),
			);

		if (insertError) throw insertError;
	}

	return normalizedCategories.sort((a, b) => {
		return (
			PROJECT_CATEGORY_VALUES.indexOf(a) -
			PROJECT_CATEGORY_VALUES.indexOf(b)
		);
	});
}
