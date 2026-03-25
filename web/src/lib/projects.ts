const LEGACY_PENDING_STATUSES = ["pending", "submitted"] as const;
const PUBLIC_PROJECT_STATUSES = ["approved", "featured"] as const;

export const ALLOWED_PROJECT_CATEGORIES = [
	"defi",
	"payments",
	"identity",
	"infrastructure",
	"other",
] as const;

export type ProjectCategory = (typeof ALLOWED_PROJECT_CATEGORIES)[number];

export function normalizeProjectStatus(status: unknown): string {
	return status === "submitted" ? "pending" : String(status ?? "");
}

export function isPendingProjectStatus(status: unknown): boolean {
	return LEGACY_PENDING_STATUSES.includes(
		normalizeProjectStatus(status) as (typeof LEGACY_PENDING_STATUSES)[number],
	);
}

export function isPublicProjectStatus(status: unknown): boolean {
	return PUBLIC_PROJECT_STATUSES.includes(
		normalizeProjectStatus(status) as (typeof PUBLIC_PROJECT_STATUSES)[number],
	);
}

export function isAllowedProjectCategory(category: unknown): boolean {
	return ALLOWED_PROJECT_CATEGORIES.includes(
		String(category ?? "").toLowerCase() as ProjectCategory,
	);
}

export function normalizeProjectCategory(category: unknown): ProjectCategory {
	const normalized = String(category ?? "").trim().toLowerCase();
	return isAllowedProjectCategory(normalized) ? normalized as ProjectCategory : "other";
}

export function normalizeProjectText(value: unknown): string | null {
	const normalized = String(value ?? "").trim();
	return normalized.length > 0 ? normalized : null;
}

export function normalizeProjectTags(value: unknown): string | null {
	const raw = String(value ?? "");
	const tags = raw
		.split(",")
		.map((tag) => tag.trim())
		.filter(Boolean);

	if (tags.length === 0) return null;

	return Array.from(new Set(tags)).join(", ");
}
