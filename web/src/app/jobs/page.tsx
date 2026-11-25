import type { Metadata } from "next";
import Link from "next/link";
import JobCard from "@/components/JobCard";
import { VALID_CATEGORIES } from "@/lib/auth";
import { isJobFeatured, JOB_TYPE_LABELS, JOB_TYPES, type Job } from "@/lib/jobs";
import { listActiveJobs, parseJobFilters } from "@/lib/jobs-server";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";
const description =
  "Find jobs, contracts and bounties at projects building on Stellar. Filter by role type and category, and apply directly to the team.";

export const metadata: Metadata = {
  title: "Jobs",
  description,
  alternates: { canonical: `${siteUrl}/jobs` },
  openGraph: {
    type: "website",
    title: "Jobs | Stellar Wave Hub",
    description,
    url: `${siteUrl}/jobs`,
  },
  twitter: {
    card: "summary",
    title: "Jobs | Stellar Wave Hub",
    description,
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toUrlSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }
  return params;
}

function categoryLabel(category: string): string {
  if (category === "defi") return "DeFi";
  if (category === "nft") return "NFT";
  if (category === "dao") return "DAO";
  if (category === "rwa") return "RWA";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/** Build a /jobs href that keeps the current filters but overrides one key. */
function filterHref(current: URLSearchParams, key: string, value: string | null): string {
  const next = new URLSearchParams(current);
  if (value) next.set(key, value);
  else next.delete(key);
  const query = next.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

const selectClass =
  "w-full rounded-xl border border-dust/30 bg-stardust/60 px-3 py-2.5 text-sm text-starlight focus:border-nova/50 focus:outline-none";

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = toUrlSearchParams(await searchParams);
  const filters = parseJobFilters(params);

  let jobs: Job[] = [];
  let loadError = false;
  try {
    jobs = await listActiveJobs(filters);
  } catch (err) {
    console.error("Jobs page error:", err);
    loadError = true;
  }

  const featured = jobs.filter((job) => isJobFeatured(job));
  const regular = jobs.filter((job) => !isJobFeatured(job));
  const hasFilters = Boolean(filters.type || filters.category || filters.currency || filters.q || filters.remote !== undefined);

  return (
    <div className="relative">
      <section className="relative overflow-hidden px-4 pb-10 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-nova/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-nova-bright">
                <span className="h-px w-8 bg-nova-bright" />
                Stellar Wave / Jobs
              </p>
              <h1 className="font-display text-5xl font-black tracking-tight text-starlight sm:text-6xl">
                Build on Stellar<span className="text-nova-bright">.</span>
              </h1>
              <p className="mt-5 text-base leading-7 text-moonlight/80 sm:text-lg">{description}</p>
            </div>
            <Link href="/my-projects" className="btn-primary inline-flex shrink-0 items-center justify-center">
              Post a job
            </Link>
          </div>

          <nav aria-label="Job type" className="mt-10 flex flex-wrap gap-2">
            <Link
              href={filterHref(params, "type", null)}
              aria-current={!filters.type ? "page" : undefined}
              className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                !filters.type
                  ? "border-nova/40 bg-nova/15 text-nova-bright"
                  : "border-dust/30 bg-stardust/50 text-moonlight/75 hover:border-nova/30 hover:text-starlight"
              }`}
            >
              All roles
            </Link>
            {JOB_TYPES.map((type) => (
              <Link
                key={type}
                href={filterHref(params, "type", type)}
                aria-current={filters.type === type ? "page" : undefined}
                className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                  filters.type === type
                    ? "border-nova/40 bg-nova/15 text-nova-bright"
                    : "border-dust/30 bg-stardust/50 text-moonlight/75 hover:border-nova/30 hover:text-starlight"
                }`}
              >
                {JOB_TYPE_LABELS[type]}
              </Link>
            ))}
          </nav>

          <form method="get" action="/jobs" className="glass mt-6 grid gap-3 rounded-2xl border border-dust/20 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_9rem_9rem_auto]">
            {filters.type && <input type="hidden" name="type" value={filters.type} />}
            <label className="block">
              <span className="sr-only">Search jobs</span>
              <input
                type="search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Search title or description"
                className={selectClass}
              />
            </label>
            <label className="block">
              <span className="sr-only">Category</span>
              <select name="category" defaultValue={filters.category ?? ""} className={selectClass}>
                <option value="">All categories</option>
                {VALID_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Location</span>
              <select
                name="remote"
                defaultValue={filters.remote === undefined ? "" : String(filters.remote)}
                className={selectClass}
              >
                <option value="">Any location</option>
                <option value="true">Remote</option>
                <option value="false">On-site</option>
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Paid in</span>
              <select name="currency" defaultValue={filters.currency ?? ""} className={selectClass}>
                <option value="">Any currency</option>
                <option value="USD">USD</option>
                <option value="XLM">XLM</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 whitespace-nowrap">
                Filter
              </button>
              {hasFilters && (
                <Link href="/jobs" className="btn-ghost inline-flex items-center whitespace-nowrap">
                  Clear
                </Link>
              )}
            </div>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pb-24 sm:px-6 lg:px-8">
        {loadError ? (
          <div className="glass rounded-2xl border border-red-500/30 p-10 text-center">
            <p className="font-display text-xl font-semibold text-starlight">Jobs couldn&apos;t be loaded</p>
            <p className="mt-2 text-sm text-moonlight/70">Please refresh the page in a moment.</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass rounded-2xl border border-dust/20 p-10 text-center sm:p-14">
            <p className="font-display text-xl font-semibold text-starlight">
              {hasFilters ? "No jobs match these filters" : "No open roles yet"}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-moonlight/70">
              {hasFilters
                ? "Try a different role type or category, or clear the filters to see every open role."
                : "Teams building on Stellar can list open roles here. Be the first to post one."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {hasFilters && (
                <Link href="/jobs" className="btn-ghost inline-flex items-center">
                  Clear filters
                </Link>
              )}
              <Link href="/my-projects" className="btn-primary inline-flex items-center">
                Post a job
              </Link>
            </div>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <section aria-labelledby="featured-jobs">
                <h2
                  id="featured-jobs"
                  className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-solar-bright"
                >
                  Featured jobs
                </h2>
                <div className="space-y-3">
                  {featured.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section aria-labelledby="all-jobs">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <h2 id="all-jobs" className="text-xs font-semibold uppercase tracking-[0.18em] text-ash">
                    {featured.length > 0 ? "More open roles" : "Open roles"}
                  </h2>
                  <span className="text-sm text-ash">
                    {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
                  </span>
                </div>
                <div className="space-y-3">
                  {regular.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
