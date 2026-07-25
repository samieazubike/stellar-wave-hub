"use client";

import { useEffect, useState } from "react";
import ProjectCard, { type Snapshot } from "@/components/ProjectCard";

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
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "top-rated", label: "Top Rated" },
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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ExplorePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [snapshotMap, setSnapshotMap] = useState<Record<number, Snapshot[]>>(
    {},
  );
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category.toLowerCase());
      if (search) params.set("search", search);
      params.set("sort", sort);
      params.set("page", String(pagination.page));
      params.set("limit", "12");

      try {
        const res = await fetch(`/api/projects?${params}`);
        const data = await res.json();
        const loaded: Project[] = data.projects || [];

        if (cancelled) return;
        setProjects(loaded);
        setPagination((prev) => ({ ...prev, ...data.pagination }));

        // Fetch snapshots for every project in parallel — failures are swallowed.
        const results = await Promise.allSettled(
          loaded.map((p) =>
            fetch(`/api/financials/${p.id}/snapshots`).then((r) => r.json()),
          ),
        );

        if (cancelled) return;
        const map: Record<number, Snapshot[]> = {};
        results.forEach((result, i) => {
          if (
            result.status === "fulfilled" &&
            Array.isArray(result.value?.snapshots)
          ) {
            map[loaded[i].id] = result.value.snapshots as Snapshot[];
          }
        });
        setSnapshotMap(map);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [category, search, sort, pagination.page]);

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
              setPagination((p) => ({ ...p, page: 1 }));
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
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 animate-in animate-in-delay-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setPagination((p) => ({ ...p, page: 1 }));
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
                snapshots={snapshotMap[project.id]}
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
          <p className="text-ash">Try adjusting your search or filters</p>
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
