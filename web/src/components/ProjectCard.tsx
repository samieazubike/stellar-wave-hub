"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import Sparkline from "@/components/Sparkline";

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

/**
 * Fetches the most-recent XLM balance snapshots for a project and returns
 * them as a plain number array suitable for <Sparkline />.
 */
function useSparklineData(projectId: number) {
  const [values, setValues] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/financials/${projectId}/snapshots?limit=20`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: {snapshots: {xlm_balance: number}[]}) => {
        if (cancelled) return;
        const numbers = (data.snapshots ?? []).map((s) => s.xlm_balance);
        setValues(numbers);
      })
      .catch(() => {
        if (!cancelled) setValues([]); // treat errors as no data
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return values; // null = loading, [] = no data, number[] = data ready
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const colorClass = categoryColors[project.category?.toLowerCase()] || "tag-nova";
  const tags = project.tags ? project.tags.split(",").slice(0, 3) : [];
  const sparkValues = useSparklineData(project.id);

  // Determine trend label for the sparkline footer chip
  const hasSpark = sparkValues !== null && sparkValues.length >= 2;
  const isUp =
    hasSpark && sparkValues[sparkValues.length - 1] >= sparkValues[0];

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

        {/* Sparkline — shown only when data is ready and has ≥2 points */}
        {hasSpark ? (
          <div className="shrink-0 flex flex-col items-end gap-0.5">
            <Sparkline values={sparkValues} width={80} height={28} />
            <span
              className={`text-[10px] font-semibold leading-none ${
                isUp ? "text-aurora-bright" : "text-supernova"
              }`}
              aria-label={isUp ? "Balance trending up" : "Balance trending down"}
            >
              {isUp ? "▲" : "▼"} XLM
            </span>
          </div>
        ) : sparkValues === null ? (
          /* Loading placeholder — fixed dimensions prevent layout shift */
          <div
            className="skeleton shrink-0 rounded"
            style={{width: 80, height: 28}}
            aria-hidden="true"
          />
        ) : null /* no data — render nothing, no layout shift */}
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
        <span className={`tag ${colorClass}`}>{project.category}</span>
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
