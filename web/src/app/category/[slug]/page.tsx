import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import ProjectCard from "@/components/ProjectCard";
import {CATEGORY_LANDING_PAGES} from "@/lib/categories";
import {getSupabase} from "@/lib/firebase";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

type CategoryProject = {
  id: number;
  numericId: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  featured: number;
  tags?: string;
  avg_rating?: number;
  rating_count: number;
  username?: string;
  logo_url?: string;
  stellar_contract_id?: string;
  created_at?: string;
  featured_expires_at?: string | null;
  user_id?: number;
};

export function generateStaticParams() {
  return CATEGORY_LANDING_PAGES.map(({slug}) => ({slug}));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{slug: string}>;
}): Promise<Metadata> {
  const {slug} = await params;
  const category = CATEGORY_LANDING_PAGES.find((item) => item.slug === slug);

  if (!category) {
    return {
      title: "Category not found",
      robots: {index: false, follow: false},
    };
  }

  const title = `${category.name} Projects`;
  const url = `${siteUrl}/category/${category.slug}`;

  return {
    title,
    description: category.description,
    alternates: {canonical: url},
    openGraph: {
      type: "website",
      title: `${title} | Stellar Wave Hub`,
      description: category.description,
      url,
    },
    twitter: {
      card: "summary",
      title: `${title} | Stellar Wave Hub`,
      description: category.description,
    },
  };
}

async function getCategoryProjects(categoryName: string): Promise<CategoryProject[]> {
  const supabase = getSupabase();
  const {data: projectRows, error: projectsError} = await supabase
    .from("projects")
    .select("*")
    .ilike("category", categoryName)
    .in("status", ["approved", "featured"])
    .order("featured", {ascending: false})
    .order("created_at", {ascending: false});

  if (projectsError) throw projectsError;
  if (!projectRows?.length) return [];

  const projectIds = projectRows.map((project) => Number(project.numericId));
  const userIds = [...new Set(
    projectRows
      .map((project) => Number(project.user_id))
      .filter((userId) => Number.isFinite(userId) && userId > 0),
  )];

  const [{data: ratingRows, error: ratingsError}, {data: userRows, error: usersError}] =
    await Promise.all([
      supabase
        .from("ratings")
        .select("project_id, score")
        .in("project_id", projectIds),
      userIds.length
        ? supabase
            .from("users")
            .select("numericId, username")
            .in("numericId", userIds)
        : Promise.resolve({data: [], error: null}),
    ]);

  if (ratingsError) throw ratingsError;
  if (usersError) throw usersError;

  const ratingStats = new Map<number, {scoreTotal: number; count: number}>();
  for (const rating of ratingRows ?? []) {
    const projectId = Number(rating.project_id);
    const stats = ratingStats.get(projectId) ?? {scoreTotal: 0, count: 0};
    stats.scoreTotal += Number(rating.score) || 0;
    stats.count += 1;
    ratingStats.set(projectId, stats);
  }

  const usernames = new Map<number, string>();
  for (const user of userRows ?? []) {
    usernames.set(Number(user.numericId), user.username);
  }

  return projectRows.map((project) => {
    const id = Number(project.numericId);
    const stats = ratingStats.get(id);
    return {
      ...project,
      id,
      avg_rating: stats ? stats.scoreTotal / stats.count : undefined,
      rating_count: stats?.count ?? 0,
      username: usernames.get(Number(project.user_id)),
    };
  });
}

function getActiveSpotlights(projects: CategoryProject[]): CategoryProject[] {
  const now = Date.now();
  return projects.filter(
    (project) =>
      project.featured === 1 &&
      project.status === "featured" &&
      (!project.featured_expires_at ||
        new Date(project.featured_expires_at).getTime() > now),
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{slug: string}>;
}) {
  const {slug} = await params;
  const category = CATEGORY_LANDING_PAGES.find((item) => item.slug === slug);
  if (!category) notFound();

  const projects = await getCategoryProjects(category.name);
  const spotlights = getActiveSpotlights(projects);
  const spotlightIds = new Set(spotlights.map((project) => project.id));
  const listedProjects = projects.filter((project) => !spotlightIds.has(project.id));
  const topRated = [...projects]
    .filter((project) => project.rating_count > 0)
    .sort(
      (a, b) =>
        (b.avg_rating ?? 0) - (a.avg_rating ?? 0) ||
        b.rating_count - a.rating_count ||
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    )
    .slice(0, 5);

  return (
    <div className="relative">
      <section className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-nova/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ash">
            <Link href="/" className="transition-colors hover:text-nova-bright">
              Home
            </Link>
            <span className="mx-2 text-dust">/</span>
            <Link href="/explore" className="transition-colors hover:text-nova-bright">
              Categories
            </Link>
            <span className="mx-2 text-dust">/</span>
            <span className="text-moonlight">{category.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-nova-bright">
                <span className="h-px w-8 bg-nova-bright" />
                Stellar Wave / Category
              </p>
              <h1 className="font-display text-5xl font-black tracking-tight text-starlight sm:text-7xl">
                {category.name}
                <span className="text-nova-bright">.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-moonlight/80 sm:text-lg">
                {category.description}
              </p>
            </div>

            <aside className="glass rounded-2xl border border-nova/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ash">
                Ecosystem directory
              </p>
              <p className="mt-3 font-display text-3xl font-bold text-starlight">
                {projects.length.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-moonlight/70">
                {projects.length === 1 ? "published project" : "published projects"}
              </p>
              <Link
                href={`/explore?category=${category.slug}`}
                className="btn-ghost mt-5 inline-flex w-full items-center justify-center"
              >
                Explore this category
              </Link>
            </aside>
          </div>

          <nav aria-label="Project categories" className="mt-10 flex flex-wrap gap-2">
            {CATEGORY_LANDING_PAGES.map((item) => (
              <Link
                key={item.slug}
                href={`/category/${item.slug}`}
                aria-current={item.slug === category.slug ? "page" : undefined}
                className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                  item.slug === category.slug
                    ? "border-nova/40 bg-nova/15 text-nova-bright"
                    : "border-dust/30 bg-stardust/50 text-moonlight/75 hover:border-nova/30 hover:text-starlight"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 pb-24 sm:px-6 lg:px-8">
        {spotlights.length > 0 && (
          <section aria-labelledby="category-spotlights">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-solar-bright">
                  Featured in {category.name}
                </p>
                <h2
                  id="category-spotlights"
                  className="font-display text-2xl font-bold text-starlight sm:text-3xl"
                >
                  Category spotlight
                </h2>
              </div>
              <span className="hidden text-sm text-ash sm:block">
                Supported projects from this ecosystem
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {spotlights.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  badge={{label: "Spotlight", variant: "solar"}}
                />
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <section aria-labelledby="category-projects">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ash">
                  The directory
                </p>
                <h2
                  id="category-projects"
                  className="font-display text-2xl font-bold text-starlight sm:text-3xl"
                >
                  {category.name} projects
                </h2>
              </div>
              <span className="text-sm text-ash">
                {listedProjects.length} {listedProjects.length === 1 ? "project" : "projects"}
              </span>
            </div>

            {listedProjects.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {listedProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            ) : (
              <div className="glass rounded-2xl border border-dust/20 p-10 text-center sm:p-14">
                <p className="font-display text-xl font-semibold text-starlight">
                  The next great {category.name} project starts here.
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ash">
                  There are no other published projects in this category yet. Help grow the
                  Stellar ecosystem by sharing what you are building.
                </p>
                <Link href="/submit" className="btn-nova mt-6 inline-flex">
                  Submit a project
                </Link>
              </div>
            )}
          </section>

          <aside className="glass rounded-2xl border border-solar/20 p-5 sm:p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-solar-bright">
              Community rated
            </p>
            <h2 className="font-display text-xl font-bold text-starlight">
              Top rated
            </h2>
            <p className="mt-2 text-sm leading-6 text-ash">
              Highest-rated {category.name} projects, ranked by community score.
            </p>

            {topRated.length > 0 ? (
              <ol className="mt-5 divide-y divide-dust/20">
                {topRated.map((project, index) => (
                  <li key={project.id} className="flex gap-3 py-4">
                    <span className="pt-0.5 font-display text-sm font-bold text-ash">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="block truncate text-sm font-semibold text-starlight transition-colors hover:text-nova-bright"
                      >
                        {project.name}
                      </Link>
                      <p className="mt-1 text-xs text-ash">
                        {project.rating_count}{" "}
                        {project.rating_count === 1 ? "rating" : "ratings"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-solar-bright">
                      {project.avg_rating?.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 border-t border-dust/20 pt-5 text-sm leading-6 text-ash">
                No community ratings yet. Explore the projects and share your perspective.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
