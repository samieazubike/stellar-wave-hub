"use client";

import Link from "next/link";

interface ProjectCardProps {
  project: {
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
    stellar_contract_id?: string;
  };
  index?: number;
}

const categoryColors: Record<string, string> = {
  defi: "tag-plasma",
  payments: "tag-aurora",
  nft: "tag-nova",
  infrastructure: "tag-solar",
  gaming: "tag-nova",
  social: "tag-aurora",
  tools: "tag-plasma",
  dao: "tag-solar",
  identity: "tag-nova",
  other: "tag-nova",
};

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const colorClass = categoryColors[project.category?.toLowerCase()] || "tag-nova";
  const tags = project.tags ? project.tags.split(",").slice(0, 3) : [];

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative glass glass-hover rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 animate-in animate-in-delay-${Math.min(index + 1, 5)}`}
    >
      {/* Featured badge */}
      {project.featured === 1 && (
        <div className="absolute -top-2 -right-2 featured-badge bg-solar/20 text-solar-bright text-xs font-bold px-2.5 py-1 rounded-full border border-solar/30 flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Featured
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-nova/30 to-plasma/30 border border-nova/20 flex items-center justify-center shrink-0 text-lg font-bold text-nova-bright group-hover:from-nova/40 group-hover:to-plasma/40 transition-all">
          {project.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-starlight group-hover:text-nova-bright transition-colors truncate">
            {project.name}
          </h3>
          {project.username && (
            <p className="text-xs text-ash mt-0.5">by {project.username}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-moonlight/80 leading-relaxed line-clamp-2 flex-1">
        {project.description}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-md bg-stardust/80 text-ash font-medium"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-dust/20">
        <div className="flex items-center gap-1.5">
          <span className={`tag ${colorClass}`}>{project.category}</span>
          {project.stellar_contract_id && (
            <span
              title="Has a deployed Soroban smart contract"
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-aurora/20 text-aurora-bright font-medium border border-aurora/30"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Smart Contract
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {project.avg_rating ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="var(--solar)"
                stroke="none"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-sm font-semibold text-solar-bright">
                {Number(project.avg_rating).toFixed(1)}
              </span>
              <span className="text-xs text-ash">
                ({project.rating_count})
              </span>
            </>
          ) : (
            <span className="text-xs text-ash">No ratings yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
