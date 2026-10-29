"use client";

import Link from "next/link";
import Image from "next/image";
import VerifiedBadge from "./VerifiedBadge";
import { useCompare } from "@/context/CompareContext";

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
    rating_velocity?: number;
    created_at?: string;
    owner_verified_at?: string | null;
    stellar_account_id?: string | null;
  };
  index?: number;
  badge?: {
    label: string;
    variant?: "solar" | "aurora" | "nova" | "plasma";
  };
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

export default function ProjectCard({ project, index = 0, badge }: ProjectCardProps) {
  const { isSelected, toggleProject, projects } = useCompare();
  const colorClass = categoryColors[project.category?.toLowerCase()] || "tag-nova";
  const tags = project.tags ? project.tags.split(",").slice(0, 3) : [];
  const selected = isSelected(project.id);
  const compareLimitReached = projects.length >= 3 && !selected;

  return (
    <article
      className={`group relative glass glass-hover rounded-2xl p-6 flex flex-col transition-all duration-300 animate-in animate-in-delay-${Math.min(index + 1, 5)}`}
    >
      {/* Featured badge or section badge */}
      {project.featured === 1 ? (
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
      ) : badge ? (
        <div
          className={`absolute -top-2 -right-2 text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
            badge.variant === "aurora"
              ? "bg-aurora/20 text-aurora-bright border-aurora/30"
              : badge.variant === "solar"
              ? "bg-solar/20 text-solar-bright border-solar/30"
              : badge.variant === "plasma"
              ? "bg-plasma/20 text-plasma-bright border-plasma/30"
              : "bg-nova/20 text-nova-bright border-nova/30"
          }`}
        >
          {badge.variant === "solar" ? (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          ) : badge.variant === "aurora" ? (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          ) : null}
          {badge.label}
        </div>
      ) : null}

      {/* Header */}
      <Link
        href={`/projects/${project.slug}`}
        className="flex flex-1 flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-nova/30 to-plasma/30 border border-nova/20 flex items-center justify-center shrink-0 text-lg font-bold text-nova-bright group-hover:from-nova/40 group-hover:to-plasma/40 transition-all overflow-hidden">
            {project.logo_url ? (
              <Image
                src={project.logo_url}
                alt={`${project.name} logo`}
                width={44}
                height={44}
                className="w-full h-hull object-cover"
              />
            ) : (
              project.name[0]
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-starlight group-hover:text-nova-bright transition-colors truncate flex items-center gap-1.5">
              <span className="truncate">{project.name}</span>
              <VerifiedBadge
                verifiedAt={project.owner_verified_at}
                account={project.stellar_account_id}
              />
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
      <button
        type="button"
        onClick={() =>
          toggleProject({
            id: project.id,
            name: project.name,
            slug: project.slug,
          })
        }
        disabled={compareLimitReached}
        aria-pressed={selected}
        aria-label={
          selected
            ? `Remove ${project.name} from comparison`
            : compareLimitReached
              ? `Comparison limit reached; ${project.name} cannot be added`
              : `Add ${project.name} to comparison`
        }
        title={compareLimitReached ? "Choose up to 3 projects" : undefined}
        className={`-t4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
          selected
            ? "border-nova/40 bg-nova/20 text-nova-bright"
            : compareLimitReached
              ? "border-dust/20 bg-transparent text-ash cursor-not-allowed"
              : "border-dust/30 bg-transparent text-moonlight hover:border-nova/40 hover:text-nova-bright"
        }`}
      >
        <span aria-hidden="true">{selected ? "✓" : "+"}</span>
        {selected ? "Added to compare" : "Add to compare"}
      </button>
    </article>
  );
}
