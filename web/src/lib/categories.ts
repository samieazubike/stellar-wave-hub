export type ProjectCategoryOption = {
	value: string;
	label: string;
};

export const PROJECT_CATEGORIES: ProjectCategoryOption[] = [
	{value: "defi", label: "DeFi"},
	{value: "payments", label: "Payments"},
	{value: "nft", label: "NFT"},
	{value: "infrastructure", label: "Infrastructure"},
	{value: "gaming", label: "Gaming"},
	{value: "social", label: "Social"},
	{value: "tools", label: "Tools"},
	{value: "dao", label: "DAO"},
	{value: "identity", label: "Identity"},
	{value: "other", label: "Other"},
];

export const PROJECT_CATEGORY_VALUES = PROJECT_CATEGORIES.map(
	(category) => category.value,
);

export function normalizeCategory(category: string): string {
	return category.trim().toLowerCase();
}

export function isProjectCategory(category: string): boolean {
	return PROJECT_CATEGORY_VALUES.includes(normalizeCategory(category));
}
