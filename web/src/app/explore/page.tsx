"use client";

import {useEffect, useMemo, useState, useCallback, useRef, Suspense} from "react";
import {useRouter, useSearchParams, usePathname} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProjectCard from "@/components/ProjectCard";
import {useRecentlyViewed} from "@/lib/useRecentlyViewed";

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

const LAST_RANDOM_SLUG_KEY = "swh_last_random_slug";

function readLastRandomSlug(): string | null {
        try {
                return window.sessionStorage.getItem(LAST_RANDOM_SLUG_KEY);
        } catch {
                return null;
        }
}

function writeLastRandomSlug(slug: string) {
        try {
                window.sessionStorage.setItem(LAST_RANDOM_SLUG_KEY, slug);
        } catch {
                // Session storage is optional; the exclude param still works within this view.
        }
}

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
	const {recent: recentlyViewed, clear: clearRecentlyViewed} = useRecentlyViewed();

	const [projects, setProjects] = useState<Project[]>([]);
	const [pagination, setPagination] = useState<Pagination>({
		page: 1,
		limit: DEFAULT_LIMIT,
		total: 0,
		pages: 0,
	});
	const [loading, setLoading] = useState(true);
	const [httpPage, setHttpPage] = useState(1);
	const [randomLoading, setRandomLoading] = useState(false);
	const [randomError, setRandomError] = useState<string | null>(null);
	const lastRandomSlug = useRef<string | null>(null);

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

	// "Surprise me" (#513): open a random approved project, excluding the one
	// the previous click landed on so repeated clicks do not repeat.
	const handleSurprise = useCallback(async () => {
		if (randomLoading) return;
		setRandomLoading(true);
		setRandomError(null);
		try {
			const previous = lastRandomSlug.current ?? readLastRandomSlug();
			const params = new URLSearchParams();
			if (previous) params.set("exclude", previous);

			const res = await fetch(`/api/projects/random?${params}`, {cache: "no-store"});
			const data = await res.json();
			if (!res.ok || typeof data.slug !== "string" || !data.slug) {
				throw new Error(
					typeof data.error === "string" ? data.error : "No project found",
				);
			}

			lastRandomSlug.current = data.slug;
			writeLastRandomSlug(data.slug);
			router.push(`/projects/${data.slug}`);
		} catch {
			setRandomError("Couldn't find a random project. Try again.");
		} finally {
			setRandomLoading(false);
		}
	}, [randomLoading, router]);

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
		const timer = window.setTimeout(() => void fetchProjects(), 0);
		return () => window.clearTimeout(timer);
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
			<div className="mb-10 animate-in flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
				<div>
					<h1 className="font-display font-bold text-3xl sm:text-4xl text-starlight mb-2">
						Explore Projects
					</h1>
					<p className="text-ash text-lg">
						Discover projects built through the Stellar Wave Program
					</p>
				</div>
				<div className="flex flex-col items-start sm:items-end gap-1.5">
					<button
						type="button"
						onClick={handleSurprise}
						disabled={randomLoading}
						aria-busy={randomLoading}
						className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-nova text-white glow-nova hover:bg-nova/90 disabled:opacity-60 disabled:cursor-wait transition-all"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" />
						</svg>
						{randomLoading ? "Finding a project..." : "Surprise me"}
					</button>
					{randomError && (
						<p role="alert" className="text-xs text-supernova">
							{randomError}
						</p>
					)}
				</div>
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

			{/* Recently viewed (#509) */}
			{recentlyViewed.length > 0 && (
				<section aria-label="Recently viewed projects" className="mb-8 animate-in">
					<div className="flex items-center justify-between gap-4 mb-3">
						<h2 className="text-xs font-semibold uppercase tracking-wider text-ash">
							Recently viewed
						</h2>
						<button
							type="button"
							onClick={clearRecentlyViewed}
							className="text-xs font-medium text-ash hover:text-starlight transition-colors"
						>
							Clear
						</button>
					</div>
					<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
						{recentlyViewed.map((project) => (
							<Link
								key={project.slug}
								href={`/projects/${project.slug}`}
								className="shrink-0 flex items-center gap-2.5 max-w-[220px] rounded-xl bg-stardust/50 hover:bg-stardust px-3 py-2 transition-colors"
							>
								<span className="w-8 h-8 rounded-lg bg-gradient-to-br from-nova/30 to-plasma/30 border border-nova/20 flex items-center justify-center shrink-0 text-sm font-bold text-nova-bright overflow-hidden">
									{project.logo_url ? (
										<Image
											src={project.logo_url}
											alt={`${project.name} logo`}
											width={32}
											height={32}
											className="w-full h-full object-cover"
										/>
									) : (
										project.name[0]
									)}
								</span>
								<span className="min-w-0">
									<span className="block text-sm font-medium text-moonlight truncate">
										{project.name}
									</span>
									{project.category && (
										<span className="block text-[11px] text-ash truncate">
											{project.category}
										</span>
									)}
								</span>
							</Link>
						))}
					</div>
				</section>
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

					{/* Pagination */}
					{pagination.pages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-12">
							<button
								disabled={pagination.page <= 1}
								onClick={() => handlePageChange(pagination.page - 1)}
							className="btn-ghost !py-2 !px-3 disabled:opacity-30 disabled:cursor-not-allowed"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="m15 18-6-6 6-6" />
								</svg>
							</button>
							<span className="text-sm text-ash px-4">
								Page {pagination.page} of {pagination.pages}
							</span>
							<button
								disabled={pagination.page >= pagination.pages}
								onClick={() => handlePageChange(pagination.page + 1)}
							className="btn-ghost !py-2 !px-3 disabled:opacity-30 disabled:cursor-not-allowed"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="m9 18 6-6-6-6" />
								</svg>
							</button>
						</div>
					)}
				</>
			) : (
				<div className="glass rounded-2xl p-16 text-center">
					<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--ash)"
							strokeWidth="1.5"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.3-4.3" />
						</svg>
					</div>
					<h3 className="font-semibold text-lg text-moonlight mb-2">
						No projects found
					</h3>
					<p className="text-ash">
						Some projects may not be available yet. Try adjusting your search or filters.
					</p>
				</div>
			)}
		</div>
	);
}

export default function ExplorePage() {
	return (
		<Suspense fallback={null}>
			<ExplorePageContent />
		</Suspense>
	);
}
