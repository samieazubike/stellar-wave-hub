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
  website_url?: string;
  github_url?: string;
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

export default function AdminPage() {
	const {user, token} = useAuth();
	const [pending, setPending] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<number | null>(null);

	const fetchPending = async () => {
		try {
			const res = await fetch("/api/projects/pending", {
				headers: {Authorization: `Bearer ${token}`},
			});
			if (res.ok) {
				const data = await res.json();
				setPending(data.projects || []);
			}
		} catch {}
		setLoading(false);
	};

	useEffect(() => {
		if (!token) {
			setLoading(false);
			return;
		}
		fetchPending();
		// fetchPending is stable within this effect scope; token is the real dependency
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	const handleAction = async (
		projectId: number,
		action: "approve" | "reject",
		extra?: {featured?: boolean; reason?: string},
	) => {
		setActionLoading(projectId);
		try {
			await fetch(`/api/projects/${projectId}/${action}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(extra || {}),
			});
			setPending((prev) => prev.filter((p) => p.id !== projectId));
		} catch {}
		setActionLoading(null);
	};

	if (!user || user.role !== "admin") {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4">
				<div className="glass rounded-2xl p-12 text-center max-w-md">
					<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-supernova/10 flex items-center justify-center">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--supernova)"
							strokeWidth="1.5"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<h2 className="font-semibold text-xl text-starlight mb-2">
						Admin access required
					</h2>
					<p className="text-ash mb-6">
						You need admin privileges to view this page
					</p>
					<Link href="/explore" className="btn-ghost inline-flex">
						Back to Explore
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="mb-8 animate-in">
				<h1 className="font-display font-bold text-3xl text-starlight mb-1">
					Admin Dashboard
				</h1>
				<p className="text-ash">
					Review and manage project submissions
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-in animate-in-delay-1">
				<div className="glass rounded-2xl p-6 text-center">
					<p className="text-3xl font-bold text-solar-bright">
						{pending.length}
					</p>
					<p className="text-sm text-ash mt-1">Pending Review</p>
				</div>
				<div className="glass rounded-2xl p-6 text-center">
					<p className="text-3xl font-bold text-aurora-bright">-</p>
					<p className="text-sm text-ash mt-1">Approved</p>
				</div>
				<div className="glass rounded-2xl p-6 text-center">
					<p className="text-3xl font-bold text-plasma-bright">-</p>
					<p className="text-sm text-ash mt-1">Total Projects</p>
				</div>
			</div>

			{/* Pending Queue */}
			<div className="animate-in animate-in-delay-2">
				<h2 className="font-semibold text-xl text-starlight mb-6">
					Pending Submissions
				</h2>

				{loading ? (
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="skeleton h-36 rounded-2xl"
							/>
						))}
					</div>
				) : pending.length > 0 ? (
					<div className="space-y-4">
						{pending.map((project) => (
							<div
								key={project.id}
								className="glass rounded-2xl p-6"
							>
								<div className="flex flex-col lg:flex-row lg:items-start gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3 mb-2">
											<h3 className="font-semibold text-lg text-starlight">
												{project.name}
											</h3>
											<span className="tag tag-nova">
												{project.category}
											</span>
										</div>
										<p className="text-sm text-moonlight/80 mb-2 line-clamp-2">
											{project.description}
										</p>
										<div className="flex gap-4 text-xs text-ash">
											<span>by {project.username}</span>
											<span>
												{new Date(
													project.created_at,
												).toLocaleDateString()}
											</span>
											{project.stellar_account_id && (
												<span className="font-mono">
													{project.stellar_account_id.slice(
														0,
														10,
													)}
													...
												</span>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<Link
											href={`/projects/${project.slug}`}
											className="btn-ghost text-sm !py-2 !px-3"
										>
											Preview
										</Link>
										<button
											disabled={
												actionLoading === project.id
											}
											onClick={() =>
												handleAction(
													project.id,
													"approve",
													{featured: false},
												)
											}
											className="bg-aurora/15 hover:bg-aurora/25 text-aurora-bright border border-aurora/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
										>
											Approve
										</button>
										<button
											disabled={
												actionLoading === project.id
											}
											onClick={() =>
												handleAction(
													project.id,
													"approve",
													{featured: true},
												)
											}
											className="bg-solar/15 hover:bg-solar/25 text-solar-bright border border-solar/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
										>
											Feature
										</button>
										<button
											disabled={
												actionLoading === project.id
											}
											onClick={() => {
												const reason = prompt(
													"Rejection reason (optional):",
												);
												handleAction(
													project.id,
													"reject",
													{
														reason:
															reason || undefined,
													},
												);
											}}
											className="bg-supernova/15 hover:bg-supernova/25 text-supernova border border-supernova/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
										>
											Reject
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="glass rounded-2xl p-12 text-center">
						<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-aurora/10 flex items-center justify-center">
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--aurora)"
								strokeWidth="1.5"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						</div>
						<h3 className="font-semibold text-lg text-moonlight mb-2">
							All caught up!
						</h3>
						<p className="text-ash">No projects pending review</p>
					</div>
				)}
			</div>
		</div>
	);
}
