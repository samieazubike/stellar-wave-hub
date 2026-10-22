"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import SubmissionNotes from "@/components/SubmissionNotes";
import { useAuth } from "@/context/AuthContext";
import { hasMinRole } from "@/lib/roles";

const CATEGORIES = [
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
] as const;

interface QueueProject {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags?: string | null;
  stellar_network: string;
  github_url?: string;
  github_repos?: { label: string; url: string }[];
  username: string | null;
  created_at: string;
  claimed_by: number | null;
  claimed_by_username: string | null;
  claimed_at: string | null;
}

interface QueueData {
  projects: QueueProject[];
  total: number;
}

interface ProjectMetadata {
  id: number;
  category: string;
  tags: string;
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
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const canClaim = !!user && !!token && hasMinRole(user.role, "maintainer");
  const isAdmin = user?.role === "admin";
  const [editing, setEditing] = useState<ProjectMetadata | null>(null);
  const [errorToast, setErrorToast] = useState<{ message: string; id: number } | null>(null);
  const { data, isLoading } = useQuery<QueueData>({
    queryKey: ["project-queue"],
    queryFn: () => fetch("/api/projects/queue").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const claimMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "claim" | "release" }) =>
      fetch(`/api/projects/${id}/claim`, {
        method: action === "claim" ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Failed to ${action}`);
        }
        return r.json();
      }),
    // Refetch either way so the button reflects the server's view of the claim.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project-queue"] });
    },
  });

  useEffect(() => {
    if (!errorToast) return;
    const timeout = window.setTimeout(() => setErrorToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [errorToast]);

  const editMetadata = useMutation({
    mutationFn: async (update: ProjectMetadata) => {
      if (!token) throw new Error("Please sign in to edit project metadata");

      const response = await fetch(`/api/projects/${update.id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category: update.category, tags: update.tags }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Failed to update project metadata");
      }
      return update;
    },
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: ["project-queue"] });
      const previous = queryClient.getQueryData<QueueData>(["project-queue"]);
      queryClient.setQueryData<QueueData>(["project-queue"], (current) =>
        current
          ? {
              ...current,
              projects: current.projects.map((project) =>
                project.id === update.id
                  ? { ...project, category: update.category, tags: update.tags }
                  : project,
              ),
            }
          : current,
      );
      return { previous };
    },
    onError: (error, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["project-queue"], context.previous);
      }
      setErrorToast((current) => ({
        message: error instanceof Error ? error.message : "Failed to update project metadata",
        id: (current?.id ?? 0) + 1,
      }));
    },
    onSuccess: (update) => {
      setEditing((current) => (current?.id === update.id ? null : current));
    },
  });

  const projects = data?.projects || [];
  const total = data?.total || 0;
  const pendingId = claimMutation.isPending ? claimMutation.variables?.id : null;
  const errorId = claimMutation.isError ? claimMutation.variables?.id : null;
  const canEditMetadata = !!user && hasMinRole(user.role, "maintainer");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {errorToast && (
        <div
          key={errorToast.id}
          role="alert"
          className="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-red-400/30 bg-[#211719] px-4 py-3 text-sm text-red-200 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <span>{errorToast.message}</span>
            <button
              type="button"
              onClick={() => setErrorToast(null)}
              aria-label="Dismiss error"
              className="text-red-200/70 hover:text-red-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
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
                    {(project.tags || "")
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag, tagIndex) => (
                        <span key={`${tag}-${tagIndex}`} className="tag bg-stardust/50 text-ash text-xs">
                          {tag}
                        </span>
                      ))}
                    {canEditMetadata && (
                      <button
                        type="button"
                        disabled={editMetadata.isPending}
                        onClick={() =>
                          setEditing({
                            id: project.id,
                            category:
                              CATEGORIES.find(
                                (category) =>
                                  category.toLowerCase() === project.category.toLowerCase(),
                              ) || project.category,
                            tags: project.tags || "",
                          })
                        }
                        aria-label={`Edit category and tags for ${project.name}`}
                        title="Edit category and tags"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-dust/30 text-ash transition-colors hover:border-nova/50 hover:text-nova-bright disabled:opacity-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                        </svg>
                      </button>
                    )}
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
                    {project.claimed_by && (
                      <span className="tag bg-nova/10 text-nova-bright border border-nova/20 text-xs">
                        Reviewing: @{project.claimed_by_username ?? "unknown"}
                        {project.claimed_at ? ` (${timeAgo(project.claimed_at)})` : ""}
                      </span>
                    )}
                  </div>

                  {editing?.id === project.id && (
                    <form
                      className="mb-4 grid gap-3 rounded-xl border border-dust/30 bg-void/30 p-4 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(14rem,1.3fr)_auto]"
                      onSubmit={(event) => {
                        event.preventDefault();
                        editMetadata.mutate({
                          ...editing,
                          tags: editing.tags
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                            .join(", "),
                        });
                      }}
                    >
                      <label className="grid gap-1.5 text-xs text-ash">
                        Category
                        <select
                          value={editing.category}
                          onChange={(event) =>
                            setEditing((current) =>
                              current?.id === project.id
                                ? { ...current, category: event.target.value }
                                : current,
                            )
                          }
                          className="h-10 rounded-lg border border-dust/40 bg-void px-3 text-sm text-moonlight outline-none focus:border-nova/60"
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          {!CATEGORIES.some(
                            (category) =>
                              category.toLowerCase() === editing.category.toLowerCase(),
                          ) && <option value={editing.category}>{editing.category}</option>}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs text-ash">
                        Tags (comma-separated)
                        <input
                          value={editing.tags}
                          onChange={(event) =>
                            setEditing((current) =>
                              current?.id === project.id
                                ? { ...current, tags: event.target.value }
                                : current,
                            )
                          }
                          placeholder="payments, soroban, defi"
                          className="h-10 rounded-lg border border-dust/40 bg-void px-3 text-sm text-moonlight outline-none placeholder:text-ash/60 focus:border-nova/60"
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button
                          type="submit"
                          disabled={editMetadata.isPending}
                          className="btn-nova inline-flex h-10 items-center justify-center px-4 text-sm disabled:opacity-50"
                        >
                          {editMetadata.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          disabled={editMetadata.isPending}
                          onClick={() => setEditing(null)}
                          className="h-10 rounded-lg px-3 text-sm text-ash hover:text-moonlight disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

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

                  {canClaim && (() => {
                    const claimedByMe = project.claimed_by === user!.id;
                    const claimedByOther = project.claimed_by !== null && !claimedByMe;
                    const busy = pendingId === project.id;
                    return (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {project.claimed_by === null ? (
                          <button
                            type="button"
                            onClick={() => claimMutation.mutate({ id: project.id, action: "claim" })}
                            disabled={busy}
                            className="btn-nova text-xs disabled:opacity-50"
                          >
                            {busy ? "Claiming..." : "Claim"}
                          </button>
                        ) : (claimedByMe || isAdmin) ? (
                          <button
                            type="button"
                            onClick={() => claimMutation.mutate({ id: project.id, action: "release" })}
                            disabled={busy}
                            className="btn-ghost text-xs disabled:opacity-50"
                          >
                            {busy ? "Releasing..." : claimedByMe ? "Release" : "Force release"}
                          </button>
                        ) : null}
                        {claimedByOther && (
                          <span className="text-xs text-solar-bright">
                            Claimed by another reviewer — approve/reject with care
                          </span>
                        )}
                        {errorId === project.id && (
                          <span role="alert" className="text-xs text-supernova">
                            {claimMutation.error?.message}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <SubmissionNotes projectId={project.id} />
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
