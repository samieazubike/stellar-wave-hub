"use client";

import {useEffect, useState, useCallback, Suspense} from "react";
import {useRouter, useSearchParams, usePathname} from "next/navigation";
import ProjectCard from "@/components/ProjectCard";

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
	{value: "oldest", label: "Oldest"},
	{value: "top-rated", label: "Top Rated"},
];

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
	is_substantial?: boolean;
	stellar_contract_id?: string;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

function ExplorePageContent() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [projects, setProjects] = useState<Project[]>([]);
	const [pagination, setPagination] = useState<Pagination>({
		page: 1,
		limit: 12,
		total: 0,
		pages: 0,
	});
	const [category, setCategory] = useState("All");
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState("newest");
	const [substantialOnly, setSubstantialOnly] = useState(
		() => searchParams.get("substantial") === "true",
	);
	const [loading, setLoading] = useState(true);

	const fetchProjects = useCallback(async () => {
		setLoading(true);
		const params = new URLSearchParams();
		if (category !== "All") params.set("category", category.toLowerCase());
		if (search) params.set("search", search);
		if (substantialOnly) params.set("substantial", "true");
		params.set("sort", sort);
		params.set("page", String(pagination.page));
		params.set("limit", "12");

		try {
			const res = await fetch(`/api/projects?${params}`);
			const data = await res.json();
			setProjects(data.projects || []);
			setPagination((prev) => ({...prev, ...data.pagination}));
		} catch {
			setProjects([]);
		}
		setLoading(false);
	}, [category, search, sort, substantialOnly, pagination.page]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	const toggleSubstantial = () => {
		const next = !substantialOnly;
		setSubstantialOnly(next);
		setPagination((p) => ({...p, page: 1}));

		const newParams = new URLSearchParams(searchParams.toString());
		if (next) newParams.set("substantial", "true");
		else newParams.delete("substantial");
		router.replace(
			newParams.toString() ? `${pathname}?${newParams}` : pathname,
			{scroll: false},
		);
	};

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

			{/* Filters */}
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
						onChange={(e) => {
							setSearch(e.target.value);
							setPagination((p) => ({...p, page: 1}));
						}}
					/>
				</div>

				{/* Sort */}
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value)}
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
					}`}
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
						onClick={() => {
							setCategory(cat);
							setPagination((p) => ({...p, page: 1}));
						}}
						className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
							category === cat
								? "bg-nova text-white glow-nova"
								: "bg-stardust/50 text-moonlight hover:bg-stardust hover:text-starlight"
						}`}
					>
						{cat}
					</button>
				))}
			</div>

			{/* Results */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="skeleton h-56 rounded-2xl" />
					))}
				</div>
			) : projects.length > 0 ? (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{projects.map((project, i) => (
							<ProjectCard
								key={project.id}
								project={project}
								index={i}
							/>
						))}
					</div>

					{/* Pagination */}
					{pagination.pages > 1 && (
						<div className="flex items-center justify-center gap-2 mt-12">
							<button
								disabled={pagination.page <= 1}
								onClick={() =>
									setPagination((p) => ({
										...p,
										page: p.page - 1,
									}))
								}
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
								onClick={() =>
									setPagination((p) => ({
										...p,
										page: p.page + 1,
									}))
								}
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
						Try adjusting your search or filters
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
