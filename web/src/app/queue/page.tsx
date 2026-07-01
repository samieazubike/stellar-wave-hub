"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface QueueProject {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  stellar_network: string;
  github_url?: string;
  github_repos?: { label: string; url: string }[];
  username: string | null;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function QueuePage() {
  const { data, isLoading } = useQuery<{ projects: QueueProject[]; total: number }>({
    queryKey: ["project-queue"],
    queryFn: () => fetch("/api/projects/queue").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const projects = data?.projects || [];
  const total = data?.total || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar/30 to-nova/30 border border-solar/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-starlight">Approval Queue</h1>
            <p className="text-ash text-sm">
              Projects submitted by researchers, waiting for admin review
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-6 animate-in animate-in-delay-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-solar animate-pulse" />
          <span className="text-sm text-moonlight font-medium">
            {total} project{total !== 1 ? "s" : ""} pending
          </span>
        </div>
        <span className="text-xs text-ash">Auto-refreshes every 30s</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-4 animate-in animate-in-delay-2">
          {projects.map((project, idx) => (
            <div
              key={project.id}
              className="glass rounded-2xl p-6 transition-all hover:border-dust/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Position indicator */}
                <div className="w-10 h-10 shrink-0 rounded-xl bg-stardust/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-ash">#{idx + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-semibold text-lg text-starlight">{project.name}</h3>
                    <span className="tag tag-nova text-xs">{project.category}</span>
                    <span
                      className={`tag text-xs ${
                        project.stellar_network === "testnet"
                          ? "bg-solar/10 text-solar-bright border border-solar/20"
                          : "bg-aurora/10 text-aurora-bright border border-aurora/20"
                      }`}
                    >
                      {project.stellar_network}
                    </span>
                    <span className="tag bg-solar/10 text-solar-bright border border-solar/20 text-xs">
                      Pending
                    </span>
                  </div>

                  <p className="text-sm text-moonlight/80 mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ash">
                    {project.username && (
                      <span>
                        by <span className="text-moonlight">{project.username}</span>
                      </span>
                    )}
                    <span>{timeAgo(project.created_at)}</span>
                    {project.github_repos && project.github_repos.length > 0 ? (
                      project.github_repos.map((repo, i) => (
                        <a
                          key={i}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-moonlight/60 hover:text-nova-bright transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          {repo.label}
                        </a>
                      ))
                    ) : project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-moonlight/60 hover:text-nova-bright transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-16 text-center animate-in animate-in-delay-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-aurora/10 border border-aurora/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--aurora-bright)" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg text-moonlight mb-2">
            All caught up
          </h3>
          <p className="text-ash mb-6">
            No projects are currently waiting for approval
          </p>
          <Link href="/submit" className="btn-nova inline-flex">
            Submit a Project
          </Link>
        </div>
      )}
    </div>
  );
}
