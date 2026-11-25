import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";

type CarouselProject = Parameters<typeof ProjectCard>[0]["project"];

/**
 * Horizontal, swipeable carousel of active spotlights (CSS scroll-snap, no
 * carousel library). Ends with a "Get featured" card. Hidden when there are
 * no active spotlights.
 */
export default function FeaturedCarousel({
  projects,
  loading,
}: {
  projects: CarouselProject[];
  loading: boolean;
}) {
  if (!loading && projects.length === 0) return null;

  return (
    <section aria-labelledby="featured-carousel-heading" className="px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 id="featured-carousel-heading" className="font-display font-bold text-2xl text-starlight">
              Spotlight
            </h2>
            <p className="text-ash text-sm mt-1">Featured projects from the Stellar Wave community</p>
          </div>
        </div>

        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 [scrollbar-width:thin]"
          role="list"
        >
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-56 shrink-0 w-[85%] sm:w-[45%] lg:w-[31%] snap-start rounded-2xl" />
              ))
            : projects.map((project, i) => (
                <div key={project.id} role="listitem" className="shrink-0 w-[85%] sm:w-[45%] lg:w-[31%] snap-start">
                  <ProjectCard project={project} index={i} badge={{ label: "Spotlight", variant: "solar" }} />
                </div>
              ))}

          {!loading && (
            <div role="listitem" className="shrink-0 w-[85%] sm:w-[45%] lg:w-[31%] snap-start">
              <Link
                href="/my-projects"
                className="glass glass-hover rounded-2xl h-full min-h-56 p-6 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-solar/30"
              >
                <span className="w-12 h-12 rounded-2xl bg-solar/10 border border-solar/20 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <span className="font-semibold text-starlight">Get featured</span>
                <span className="text-sm text-ash">Put your project in the spotlight from My Projects.</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
