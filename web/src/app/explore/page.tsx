"use client";

import {useEffect, useMemo, useState, useCallback, Suspense} from "react";
import {useRouter, useSearchParams, usePathname} from "next/navigation";
import ProjectCard from "@/components/ProjectCard";
import SponsorBanner from "@/components/SponsorBanner";

const CATEGORIES = [
	"All",
	"DeFi",
	"Payments",
	"NFT",
	"Infrastructure",
	"Gaming",
	"Social",
	"Tools",
	"DAO",
	"Identity",
	"Other",
];

const SORT_OPTIONS = [
	{value: "newest", label: "Newest"},
	{value: "trending", label: "Trending"},
	{value: "new-this-week", label: "New This Week"},
	{value: "top-rated", label: "Top Rated"},
	{value: "most-reviewed", label: "Most Reviewed"},
	{value: "oldest", label: "Oldest"},
];

const DEFAULT_SORT = "newest";
const DEFAULT_LIMIT = 12;

function normalizeCategory(value: string | null): string {
	if (!value) return "All";
	const match = CATEGORIES.find(
		(c) => c.toLowerCase() === value.toLowerCase(),
	);
	return match ?? "All";
}

function normalizeSort(value: string | null): string {
	if (!value) return DEFAULT_SORT;
	return SORT_OPTIONS.some((o) => o.value === value)
		? value
		: DEFAULT_SORT;
}

function normalizePage(value: string | null): number {
	const parsed = parseInt(value ?? "", 10);
	if (!Number.isFinite(parsed) || parsed < 1) return 1;
	return parsed;
}
/** Position (0-based) at which the sponsored card is inserted. */
const SPONSORED_SLOT = 3;

interface Project {
	id: number;
	name: string;
	slug: string;
	description: string;
	category: string;
	status: string;
	featured: number;
	tags?: string;
	avg_rating?: number;
	rating_count?: number;
	username?: string;
	logo_url?: string;
	is_substantial?: boolean;
	stellar_contract_id?: string;
	rating_velocity?: number;
	created_at?: string;
	/** Internal flag – not from API */
	_isSponsored?: boolean;
}

interface CategorySponsor {
	id: number;
	name: string;
	tagline?: string;
	logo_url?: string;
	url?: string;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

/**
 * Returns true when the user's search string is an exact (case-insensitive)
 * match of an organic project name already on the page.  In that case we
 * suppress the sponsored slot per the acceptance criteria.
 */
function isExactNameSearch(search: string, projects: Project[]): boolean {
	if (!search.trim()) return false;
	const needle = search.trim().toLowerCase();
	return projects.some((p) => p.name.trim().toLowerCase() === needle);
}

function ExplorePageContent() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const queryString = searchParams.toString();

	const [projects, setProjects] = useState<Project[]>([]);
	const [pagination, setPagination] = useState<Pagination>({
		page: 1,
		limit: DEFAULT_LIMIT,
		total: 0,
		pages: 0,
	});
	const [loading, setLoading] = useState(true);
	const [httpPage, setHttpPage] = useState(1);

	// The URL is the single source of truth for the view, so reloads, shared
	// links and back/forward all restore the same filters.
	const category = normalizeCategory(searchParams.get("category"));
	const search = searchParams.get("search") ?? "";
	const sort = normalizeSort(searchParams.get("sort"));
	const substantialOnly = searchParams.get("substantial") === "true";
	const page = normalizePage(searchParams.get("page"));

	const updateParams = useCallback(
		(changes: Record<string, string | null>, resetPage = true) => {
			const params = new URLSearchParams(queryString);
			for (const [key, value] of Object.entries(changes)) {
				if (value === null || value === "") params.delete(key);
				else params.set(key, value);
			}
			if (resetPage) params.delete("page");
			const next = params.toString();
			router.replace(next ? `${pathname}?${next}` : pathname, {scroll: false});
		},
		[queryString, pathname, router],
	);

	// ------------------------------------------------------------------ //
	// Fetch category sponsor                                              //
	// ------------------------------------------------------------------ //
	const [sponsor, setSponsor] = useState<CategorySponsor | null>(null);

	useEffect(() => {
		if (category === "All") {
			setSponsor(null);
			return;
		}
		let cancelled = false;
		fetch(`/api/sponsors/category/${encodeURIComponent(category.toLowerCase())}`, {
			cache: "no-store",
		})
			.then((r) => (r.ok ? r.json() : {sponsor: null}))
			.then((data) => {
				if (!cancelled) setSponsor(data.sponsor ?? null);
			})
			.catch(() => {
				if (!cancelled) setSponsor(null);
			});
		return () => {
			cancelled = true;
		};
	}, [category]);

	// ------------------------------------------------------------------ //
	// Fetch organic results                                                //
	// ------------------------------------------------------------------ //
	const fetchProjects = useCallback(async () => {
		setLoading(true);
		const params = new URLSearchParams();
		if (category !== "All") params.set("category", category.toLowerCase());
		if (search) params.set("search", search);
		if (substantialOnly) params.set("substantial", "true");
		params.set("sort", sort);
		params.set("page", String(page));
		params.set("limit", String(DEFAULT_LIMIT));

		try {
			const res = await fetch(`/api/projects?${params}`, {
				cache: "no-store",
			});
			const data = await res.json();
			setProjects(data.projects || []);
			setPagination((prev) => ({...prev, ...data.pagination}));
			setHttpPage(data.pagination?.page ?? page);
		} catch {
			setProjects([]);
		}
		setLoading(false);
	}, [category, search, sort, substantialOnly, page]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	const toggleSubstantial = () =>
		updateParams({substantial: substantialOnly ? null : "true"});
	const handleCategoryChange = (cat: string) =>
		updateParams({category: cat === "All" ? null : cat.toLowerCase()});
	const handleSearchChange = (value: string) => updateParams({search: value});
	const handleSortChange = (value: string) =>
		updateParams({sort: value === DEFAULT_SORT ? null : value});
	const handlePageChange = (nextPage: number) =>
		updateParams({page: nextPage > 1 ? String(nextPage) : null}, false);
	// Sponsored slot (#462): one active spotlight not already on the page,
	// matching the category filter, inserted at SPONSORED_SLOT.
	const [sponsored, setSponsored] = useState<Project | null>(null);

	useEffect(() => {
		if (loading) return;
		let cancelled = false;
		const spotlightParams = new URLSearchParams();
		if (category !== "All") spotlightParams.set("category", category.toLowerCase());
		const organicIds = projects.map((p) => p.id).join(",");
		if (organicIds) spotlightParams.set("exclude", organicIds);

		fetch(`/api/spotlights?${spotlightParams}`)
			.then((r) => (r.ok ? r.json() : {spotlights: []}))
			.then((data) => {
				if (cancelled) return;
				const spotlights: Project[] = data.spotlights ?? [];
				// No active spotlight: show organic results only.
				if (spotlights.length === 0) {
					setSponsored(null);
					return;
				}
				setSponsored({...spotlights[0], _isSponsored: true});
			})
			.catch(() => {
				if (!cancelled) setSponsored(null);
			});
		return () => {
			cancelled = true;
		};
	}, [loading, projects, category]);

	const displayProjects = useMemo(() => {
		// Never show a sponsored card when the user searched a project by exact name.
		if (!sponsored || isExactNameSearch(search, projects)) return projects;
		const insertAt = Math.min(SPONSORED_SLOT, projects.length);
		return [...projects.slice(0, insertAt), sponsored, ...projects.slice(insertAt)];
	}, [projects, sponsored, search]);


	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Header */}
			<div className="mb-10 animate-in">
				<h1 className="font-display font-bold text-3xl sm:text-4xl text-starlight mb-2">
					Explore Projects
				</h1>
				<p className="text-ash text-lg">
					Discover projects built through the Stellar Wave Program
				</p>
			</div>

			<div className="flex flex-col lg:flex-row gap-4 mb-8 animate-in animate-in-delay-1">
				{/* Search */}
				<div className="relative flex-1">
					<svg
						className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3" />
					</svg>
						<input
						type="text"
						placeholder="Search projects..."
						className="input-field !pl-11"
						value={search}
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
				</div>

				{/* Sort */}
				<select
					value={sort}
					onChange={(e) => handleSortChange(e.target.value)}
					className="input-field !w-auto !pr-10 appearance-none cursor-pointer"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237c7893' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
						backgroundRepeat: "no-repeat",
						backgroundPosition: "right 12px center",
					}}
				>
					{SORT_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>

				{/* Substantial only toggle */}
				<button
					type="button"
					aria-pressed={substantialOnly}
					onClick={toggleSubstantial}
					className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
						substantialOnly
							? "bg-nova text-white glow-nova"
							: "bg-stardust/50 text-moonlight hover:bg-stardust hover:text-starlight"
					}`.trim()}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						>
						<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
					</svg>
					Substantial only
				</button>
			</div>

			{/* Category tabs */}
			<div className="flex gap-2 overflow-x-auto pb-4 mb-8 animate-in animate-in-delay-2 scrollbar-none">
				{CATEGORIES.map((cat) => (
					<button
						key={cat}
						onClick={() => handleCategoryChange(cat)}
						className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
							category === cat
								? "bg-nova text-white glow-nova"
							: "bg-stardust/50 text-moonlight hover:bg-stardust hover:text-starlight"
						}`.trim()}
						>
						{cat}
						</button>
				))}
			</div>

			{/* Category sponsor banner */}
			{category !== "All" && (
				<SponsorBanner key={category} category={category} sponsor={sponsor} />
			)}

			{/* Results */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="skeleton h-56 rounded-2xl" />
					))}
				</div>
			) : displayProjects.length > 0 ? (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{displayProjects.map((project, i) =>
							project._isSponsored ? (
								<div key={`sponsored-${project.id}`} className="relative">
									{/* Subtle outer glow to visually distinguish the sponsored card */}
									<div
										className="absolute inset-0 rounded-2xl pointer-events-none"
										style={{
											boxShadow:
												"0 0 0 1px rgba(var(--solar-rgb,251,191,36),0.25)",
										}}
										aria-hidden="true"
									/>
									<ProjectCard
										project={project}
										index={i}
										badge={{
											label: "Sponsored",
											variant: "solar",
										}}
									/>
								</div>
							) : (
								<ProjectCard
									key={project.id}
									project={project}
									index={i}
								/>
							),
						)}
					</div>
				</>
			) : null}
		</div>
	);
}
