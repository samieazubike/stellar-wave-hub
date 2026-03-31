"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  featured: number;
  username: string;
  stellar_account_id?: string;
  stellar_network?: string;
  website_url?: string;
  github_url?: string;
  github_repos?: { label: string; url: string }[];
  avg_rating?: number;
  rating_count?: number;
  rejection_reason?: string;
  research_images?: string[];
  created_at: string;
}

// ─── Fetch helpers ──────────────────────────────────────────────────

function useAdminProjects(status: string | null, token: string | null) {
  return useQuery<Project[]>({
    queryKey: ["admin-projects", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await fetch(`/api/admin/projects${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.projects || [];
    },
    enabled: !!token,
  });
}

function usePendingProjects(token: string | null) {
  return useQuery<Project[]>({
    queryKey: ["admin-projects", "submitted"],
    queryFn: async () => {
      const res = await fetch("/api/projects/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.projects || [];
    },
    enabled: !!token,
  });
}

// ─── Action hooks ───────────────────────────────────────────────────

function useProjectAction(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      action,
      body,
    }: {
      projectId: number;
      action: string;
      body?: Record<string, unknown>;
    }) => {
      const method = action === "delete" ? "DELETE" : "PUT";
      const res = await fetch(`/api/projects/${projectId}/${action}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body || {}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });
}

// ─── Reject Dialog ──────────────────────────────────────────────────

function RejectDialog({
  project,
  onConfirm,
  isPending,
}: {
  project: Project;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          disabled={isPending}
          className="bg-supernova/15 hover:bg-supernova/25 text-supernova border border-supernova/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          Reject
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Reject &ldquo;{project.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This project will be moved to rejected status and won&apos;t appear in the public directory.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium text-moonlight">
            Reason <span className="text-ash">(optional)</span>
          </label>
          <Textarea
            placeholder="e.g. Not a Stellar Wave project, insufficient description..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm(reason);
              setReason("");
              setOpen(false);
            }}
          >
            Reject Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Delist Dialog ──────────────────────────────────────────────────

function DelistDialog({
  project,
  onConfirm,
  isPending,
}: {
  project: Project;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          disabled={isPending}
          className="bg-supernova/10 hover:bg-supernova/20 text-supernova/80 hover:text-supernova border border-supernova/10 font-medium text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          Delist
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delist &ldquo;{project.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the project from the public directory. It was previously{" "}
            <span className="text-aurora-bright font-medium">
              {project.status === "featured" ? "featured" : "approved"}
            </span>
            . You can re-approve it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium text-moonlight">
            Reason for delisting
          </label>
          <Textarea
            placeholder="e.g. Mistakenly approved, project no longer active..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm(reason);
              setReason("");
              setOpen(false);
            }}
          >
            Delist Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Delete Dialog ──────────────────────────────────────────────────

function DeleteDialog({
  project,
  onConfirm,
  isPending,
}: {
  project: Project;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          disabled={isPending}
          className="text-supernova/50 hover:text-supernova text-xs underline-offset-2 hover:underline transition-all disabled:opacity-50"
        >
          Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Permanently delete &ldquo;{project.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The project and all its ratings will be permanently removed from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-supernova/20 hover:bg-supernova/40 border-supernova/30"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Status badge ───────────────────────────────────────────────────

function StatusBadge({ status, featured }: { status: string; featured?: number }) {
  const styles: Record<string, string> = {
    submitted: "tag-solar",
    approved: "tag-aurora",
    featured: "tag-nova",
    rejected: "bg-supernova/10 text-supernova border border-supernova/20",
    delisted: "bg-dust/50 text-ash border border-dust/30",
  };
  const label = featured ? "featured" : status;
  return (
    <span className={`tag ${styles[label] || "tag-nova"}`}>
      {label}
    </span>
  );
}

// ─── Project card for pending queue ─────────────────────────────────

function PendingCard({
  project,
  action,
}: {
  project: Project;
  action: ReturnType<typeof useProjectAction>;
}) {
  const isLoading = action.isPending;

  return (
    <div className="glass rounded-2xl p-6 transition-all hover:border-dust/40">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="font-semibold text-lg text-starlight">
              {project.name}
            </h3>
            <span className="tag tag-nova text-xs">{project.category}</span>
            {project.stellar_network && (
              <span className={`tag text-xs ${project.stellar_network === "testnet" ? "bg-solar/10 text-solar-bright border border-solar/20" : "bg-aurora/10 text-aurora-bright border border-aurora/20"}`}>
                {project.stellar_network}
              </span>
            )}
          </div>
          <p className="text-sm text-moonlight/80 mb-3 line-clamp-2">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ash">
            <span>
              by <span className="text-moonlight">{project.username}</span>
            </span>
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
            {project.stellar_account_id && (
              <span className="font-mono text-plasma-bright/60">
                {project.stellar_account_id.slice(0, 10)}...
              </span>
            )}
          </div>

          {/* Research images — admin only */}
          {project.research_images && project.research_images.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dust/20">
              <p className="text-xs font-medium text-ash uppercase tracking-wider mb-2">
                Research Images ({project.research_images.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {project.research_images.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 group"
                  >
                    <img
                      src={url}
                      alt={`Research ${i + 1}`}
                      className="w-28 h-20 object-cover rounded-lg border border-dust/30 group-hover:border-nova/40 transition-all"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            href={`/projects/${project.slug}`}
            className="btn-ghost text-sm !py-2 !px-3"
            target="_blank"
          >
            Preview
          </Link>
          <button
            disabled={isLoading}
            onClick={() =>
              action.mutate({
                projectId: project.id,
                action: "approve",
                body: { featured: false },
              })
            }
            className="bg-aurora/15 hover:bg-aurora/25 text-aurora-bright border border-aurora/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={isLoading}
            onClick={() =>
              action.mutate({
                projectId: project.id,
                action: "approve",
                body: { featured: true },
              })
            }
            className="bg-solar/15 hover:bg-solar/25 text-solar-bright border border-solar/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            Feature
          </button>
          <RejectDialog
            project={project}
            isPending={isLoading}
            onConfirm={(reason) =>
              action.mutate({
                projectId: project.id,
                action: "reject",
                body: { reason: reason || undefined },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Project row for approved/all lists ─────────────────────────────

function ProjectRow({
  project,
  action,
}: {
  project: Project;
  action: ReturnType<typeof useProjectAction>;
}) {
  const isLoading = action.isPending;

  return (
    <div className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all hover:border-dust/40">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Link
            href={`/projects/${project.slug}`}
            className="font-medium text-starlight hover:text-nova-bright transition-colors truncate"
          >
            {project.name}
          </Link>
          <StatusBadge status={project.status} featured={project.featured} />
          <span className="tag text-xs bg-stardust/50 text-ash border border-dust/20">
            {project.category}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ash">
          <span>by {project.username}</span>
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
          {project.avg_rating != null && (
            <span className="text-solar-bright">
              {project.avg_rating.toFixed(1)} ({project.rating_count} ratings)
            </span>
          )}
          {project.rejection_reason && (
            <span className="text-supernova/70 italic truncate max-w-[200px]">
              {project.rejection_reason}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {(project.status === "approved" || project.status === "featured") && (
          <DelistDialog
            project={project}
            isPending={isLoading}
            onConfirm={(reason) =>
              action.mutate({
                projectId: project.id,
                action: "delist",
                body: { reason },
              })
            }
          />
        )}
        {(project.status === "rejected" || project.status === "delisted") && (
          <button
            disabled={isLoading}
            onClick={() =>
              action.mutate({
                projectId: project.id,
                action: "approve",
                body: { featured: false },
              })
            }
            className="bg-aurora/10 hover:bg-aurora/20 text-aurora-bright/80 hover:text-aurora-bright border border-aurora/10 font-medium text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            Re-approve
          </button>
        )}
        {project.status !== "featured" &&
          (project.status === "approved" || project.status === "featured") && (
          <button
            disabled={isLoading}
            onClick={() =>
              action.mutate({
                projectId: project.id,
                action: "approve",
                body: { featured: true },
              })
            }
            className="bg-solar/10 hover:bg-solar/20 text-solar-bright/80 hover:text-solar-bright border border-solar/10 font-medium text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            Feature
          </button>
        )}
        {project.featured === 1 && (
          <button
            disabled={isLoading}
            onClick={() =>
              action.mutate({
                projectId: project.id,
                action: "approve",
                body: { featured: false },
              })
            }
            className="bg-dust/30 hover:bg-dust/50 text-ash hover:text-moonlight border border-dust/20 font-medium text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            Unfeature
          </button>
        )}
        <DeleteDialog
          project={project}
          isPending={isLoading}
          onConfirm={() =>
            action.mutate({ projectId: project.id, action: "delete" })
          }
        />
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-moonlight mb-2">{title}</h3>
      <p className="text-ash">{subtitle}</p>
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────

function Skeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────

// ─── Search filter helper ──────────────────────────────────────────

function filterProjects(projects: Project[], query: string): Project[] {
  if (!query.trim()) return projects;
  const q = query.toLowerCase();
  return projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const action = useProjectAction(token);
  const [search, setSearch] = useState("");

  const { data: pending = [], isLoading: pendingLoading } = usePendingProjects(token);
  const { data: approved = [], isLoading: approvedLoading } = useAdminProjects("approved", token);
  const { data: featured = [], isLoading: featuredLoading } = useAdminProjects("featured", token);
  const { data: all = [], isLoading: allLoading } = useAdminProjects(null, token);

  const filteredPending = filterProjects(pending, search);
  const filteredApproved = filterProjects(approved, search);
  const filteredFeatured = filterProjects(featured, search);
  const filteredAll = filterProjects(all, search);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-supernova/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--supernova)" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="font-semibold text-xl text-starlight mb-2">Admin access required</h2>
          <p className="text-ash mb-6">You need admin privileges to view this page</p>
          <Link href="/explore" className="btn-ghost inline-flex">Back to Explore</Link>
        </div>
      </div>
    );
  }

  const rejectedCount = filteredAll.filter((p) => p.status === "rejected" || p.status === "delisted").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar/30 to-nova/30 border border-solar/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-starlight">Admin Dashboard</h1>
        </div>
        <p className="text-ash ml-[52px]">Manage project submissions, approvals, and listings</p>
      </div>

      {/* Search */}
      <div className="mb-6 animate-in animate-in-delay-1">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ash pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search projects by name, category, or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stardust/50 border border-dust/30 rounded-xl text-sm text-moonlight placeholder:text-ash/60 focus:outline-none focus:border-nova/40 focus:ring-1 focus:ring-nova/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-moonlight transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-in animate-in-delay-2">
        <div className="glass rounded-2xl p-5">
          <p className="text-2xl font-bold text-solar-bright">{pending.length}</p>
          <p className="text-xs text-ash mt-0.5 uppercase tracking-wider">Pending</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-2xl font-bold text-aurora-bright">{approved.length}</p>
          <p className="text-xs text-ash mt-0.5 uppercase tracking-wider">Approved</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-2xl font-bold text-nova-bright">{featured.length}</p>
          <p className="text-xs text-ash mt-0.5 uppercase tracking-wider">Featured</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-2xl font-bold text-plasma-bright">{all.length}</p>
          <p className="text-xs text-ash mt-0.5 uppercase tracking-wider">Total</p>
        </div>
      </div>

      {/* Mutation feedback */}
      {action.isError && (
        <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm mb-6 animate-in">
          {action.error.message}
        </div>
      )}

      {/* Tabs */}
      <div className="animate-in animate-in-delay-3">
        <Tabs defaultValue="pending">
          <TabsList className="flex-wrap">
            <TabsTrigger value="pending">
              Pending
              {filteredPending.length > 0 && (
                <span className="ml-2 bg-solar/20 text-solar-bright text-xs px-2 py-0.5 rounded-md">
                  {filteredPending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected / Delisted
              {rejectedCount > 0 && (
                <span className="ml-2 bg-supernova/15 text-supernova/80 text-xs px-2 py-0.5 rounded-md">
                  {rejectedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Projects</TabsTrigger>
          </TabsList>

          {/* ── Pending tab ── */}
          <TabsContent value="pending">
            {pendingLoading ? (
              <Skeletons />
            ) : filteredPending.length > 0 ? (
              <div className="space-y-4">
                {filteredPending.map((p) => (
                  <PendingCard key={p.id} project={p} action={action} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--aurora)" strokeWidth="1.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
                title="All caught up!"
                subtitle="No projects pending review"
              />
            )}
          </TabsContent>

          {/* ── Approved tab ── */}
          <TabsContent value="approved">
            {approvedLoading ? (
              <Skeletons />
            ) : filteredApproved.length > 0 ? (
              <div className="space-y-2">
                {filteredApproved.map((p) => (
                  <ProjectRow key={p.id} project={p} action={action} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
                title="No approved projects"
                subtitle="Approved projects will appear here"
              />
            )}
          </TabsContent>

          {/* ── Featured tab ── */}
          <TabsContent value="featured">
            {featuredLoading ? (
              <Skeletons />
            ) : filteredFeatured.length > 0 ? (
              <div className="space-y-2">
                {filteredFeatured.map((p) => (
                  <ProjectRow key={p.id} project={p} action={action} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--solar)" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                }
                title="No featured projects"
                subtitle="Feature projects to highlight them in the directory"
              />
            )}
          </TabsContent>

          {/* ── Rejected / Delisted tab ── */}
          <TabsContent value="rejected">
            {allLoading ? (
              <Skeletons />
            ) : rejectedCount > 0 ? (
              <div className="space-y-2">
                {filteredAll
                  .filter((p) => p.status === "rejected" || p.status === "delisted")
                  .map((p) => (
                    <ProjectRow key={p.id} project={p} action={action} />
                  ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                }
                title="No rejected projects"
                subtitle="Rejected and delisted projects will appear here"
              />
            )}
          </TabsContent>

          {/* ── All projects tab ── */}
          <TabsContent value="all">
            {allLoading ? (
              <Skeletons count={5} />
            ) : filteredAll.length > 0 ? (
              <div className="space-y-2">
                {filteredAll.map((p) => (
                  <ProjectRow key={p.id} project={p} action={action} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                }
                title="No projects yet"
                subtitle="Projects will appear here once submitted"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
