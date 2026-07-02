"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasMinRole } from "@/lib/roles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ON_CHAIN_ENABLED,
  explorerTxUrl,
  getRatingFee,
  getRegistrationFee,
  getContractVersion,
  getWasmVersion,
  getContractAdmin,
  getTreasuryBalance,
  setRatingFeeOnChain,
  setRegistrationFeeOnChain,
  setTreasuryOnChain,
  withdrawFeesOnChain,
  registerProjectOnChain,
  removeProjectOnChain,
  upgradeVersionOnChain,
  transferAdminOnChain,
} from "@/lib/ratingContract";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

interface PromoCode {
  id: number;
  code: string;
  percent_off: number;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
}

function useAdminPromoCodes(token: string | null) {
  return useQuery<PromoCode[]>({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/promo-codes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch promo codes");
      const data = await res.json();
      return data.promoCodes || [];
    },
    enabled: !!token,
  });
}

function PromoCodesTab({ token }: { token: string | null }) {
  const qc = useQueryClient();
  const { data: promos = [], isLoading } = useAdminPromoCodes(token);
  
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          percent_off: Number(percentOff),
          max_uses: maxUses ? Number(maxUses) : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create promo code");
      }
      setCode("");
      setPercentOff("");
      setMaxUses("");
      setExpiresAt("");
      qc.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePromo = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    try {
      const res = await fetch(`/api/admin/promo-codes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete promo code");
      qc.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting code");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-starlight mb-4">Create Promo Code</h3>
        <form onSubmit={createPromo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs text-ash mb-1 block">Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input-field w-full text-sm font-mono"
              placeholder="e.g. HALFOFF"
            />
          </div>
          <div>
            <label className="text-xs text-ash mb-1 block">% Off *</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
              className="input-field w-full text-sm"
              placeholder="e.g. 50"
            />
          </div>
          <div>
            <label className="text-xs text-ash mb-1 block">Max Uses (optional)</label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="input-field w-full text-sm"
              placeholder="e.g. 100"
            />
          </div>
          <div>
            <label className="text-xs text-ash mb-1 block">Expires (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input-field w-full text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !code || !percentOff}
            className="btn-nova text-sm w-full h-[42px] disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </form>
        {error && <p className="text-supernova text-xs mt-3">{error}</p>}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-starlight mb-4">Active Promo Codes</h3>
        {isLoading ? (
          <Skeletons count={2} />
        ) : promos.length > 0 ? (
          <div className="space-y-3">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="bg-stardust/30 border border-dust/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap hover:border-dust/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-plasma-bright text-lg">
                      {promo.code}
                    </span>
                    <span className="tag tag-solar text-xs font-semibold">
                      {promo.percent_off}% OFF
                    </span>
                    {promo.expires_at && new Date(promo.expires_at) < new Date() && (
                      <span className="tag tag-supernova text-xs">Expired</span>
                    )}
                    {promo.max_uses && promo.uses >= promo.max_uses && (
                      <span className="tag tag-supernova text-xs">Depleted</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ash">
                    <span>
                      Uses: <span className="text-moonlight">{promo.uses}</span>
                      {promo.max_uses ? ` / ${promo.max_uses}` : " (Unlimited)"}
                    </span>
                    {promo.expires_at && (
                      <span>
                        Expires: <span className="text-moonlight">{new Date(promo.expires_at).toLocaleDateString()} {new Date(promo.expires_at).toLocaleTimeString()}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deletePromo(promo.id)}
                  className="bg-supernova/10 hover:bg-supernova/20 text-supernova border border-supernova/20 text-xs px-4 py-2 rounded-lg transition-all font-medium shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-ash text-sm">No promo codes created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reject Dialog ──────────────────────────────────────────────────

const REJECT_REASON_TEMPLATES = [
  {
    label: "Not part of the Stellar Wave Program",
    text: "This project does not appear to be part of the Stellar Wave Program.",
  },
  {
    label: "Unverifiable on-chain account/contract ID",
    text: "The Stellar account ID / Soroban contract ID provided could not be verified on-chain.",
  },
  {
    label: "Description too short or not original",
    text: "The description doesn't meet the minimum length, or appears to be copied rather than original.",
  },
  {
    label: "Category/tags don't match the project",
    text: "The category and/or tags don't accurately reflect what this project does.",
  },
  {
    label: "Duplicate submission",
    text: "This project has already been submitted.",
  },
  {
    label: "Other / write a custom reason",
    text: "",
  },
] as const;

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
  const [template, setTemplate] = useState("");
  const [open, setOpen] = useState(false);

  const reset = () => {
    setReason("");
    setTemplate("");
  };

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
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-moonlight">
              Template <span className="text-ash">(optional)</span>
            </label>
            <Select
              value={template}
              onValueChange={(value) => {
                setTemplate(value);
                const picked = REJECT_REASON_TEMPLATES.find((t) => t.label === value);
                setReason(picked?.text ?? "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason template..." />
              </SelectTrigger>
              <SelectContent>
                {REJECT_REASON_TEMPLATES.map((t) => (
                  <SelectItem key={t.label} value={t.label}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={reset}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm(reason);
              reset();
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

// ─── Contract panel ─────────────────────────────────────────────────

interface ContractInfo {
  version: string | null;
  wasmVersion: number | null;
  admin: string | null;
  ratingFee: bigint | null;
  registrationFee: bigint | null;
  treasuryBalance: bigint | null;
}

function feeToUsdc(stroops: bigint | null): string {
  if (stroops === null) return "—";
  const v = Number(stroops) / 1_000_000;
  return `${v.toFixed(v < 0.01 ? 6 : 2)} USDC`;
}

function usdcToStroops(usdc: string): bigint {
  const n = parseFloat(usdc);
  if (isNaN(n) || n < 0) throw new Error("Invalid amount");
  return BigInt(Math.round(n * 1_000_000));
}

function ContractPanel({ adminAddress }: { adminAddress: string }) {
  const [info, setInfo] = useState<ContractInfo>({
    version: null, wasmVersion: null, admin: null,
    ratingFee: null, registrationFee: null, treasuryBalance: null,
  });
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [txMsg, setTxMsg] = useState<{ text: string; hash?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Form fields
  const [newRatingFee, setNewRatingFee] = useState("");
  const [newRegFee, setNewRegFee] = useState("");
  const [newTreasury, setNewTreasury] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  const [regProjectId, setRegProjectId] = useState("");
  const [regAccountId, setRegAccountId] = useState("");
  const [removeProjectId, setRemoveProjectId] = useState("");

  const fetchInfo = useCallback(async () => {
    setLoadingInfo(true);
    try {
      const [version, wasmVersion, admin, ratingFee, registrationFee, treasuryBalance] =
        await Promise.allSettled([
          getContractVersion(),
          getWasmVersion(),
          getContractAdmin(),
          getRatingFee(),
          getRegistrationFee(),
          getTreasuryBalance(),
        ]);
      setInfo({
        version: version.status === "fulfilled" ? version.value : null,
        wasmVersion: wasmVersion.status === "fulfilled" ? wasmVersion.value : null,
        admin: admin.status === "fulfilled" ? admin.value : null,
        ratingFee: ratingFee.status === "fulfilled" ? ratingFee.value : null,
        registrationFee: registrationFee.status === "fulfilled" ? registrationFee.value : null,
        treasuryBalance: treasuryBalance.status === "fulfilled" ? treasuryBalance.value : null,
      });
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  useEffect(() => {
    if (ON_CHAIN_ENABLED) fetchInfo();
  }, [fetchInfo]);

  async function run(label: string, fn: () => Promise<string>) {
    setBusy(true);
    setTxMsg(null);
    try {
      const hash = await fn();
      setTxMsg({ text: `${label} confirmed.`, hash });
      fetchInfo();
    } catch (err) {
      setTxMsg({ text: err instanceof Error ? err.message : "Failed" });
    }
    setBusy(false);
  }

  if (!ON_CHAIN_ENABLED) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg text-moonlight mb-2">Contract not configured</h3>
        <p className="text-ash text-sm">
          Set <code className="text-plasma-bright font-mono">NEXT_PUBLIC_CONTRACT_ID</code> to enable on-chain operations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {txMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-4 ${txMsg.hash ? "bg-aurora/10 border border-aurora/20 text-aurora-bright" : "bg-supernova/10 border border-supernova/20 text-supernova"}`}>
          <span>{txMsg.text}</span>
          <div className="flex items-center gap-3 shrink-0">
            {txMsg.hash && (
              <a href={explorerTxUrl(txMsg.hash)} target="_blank" rel="noopener noreferrer" className="underline font-mono text-xs">
                View tx
              </a>
            )}
            <button onClick={() => setTxMsg(null)} className="opacity-60 hover:opacity-100 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Contract info */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-starlight flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            Contract State
          </h3>
          <button
            onClick={fetchInfo}
            disabled={loadingInfo}
            className="btn-ghost text-xs !py-1.5 !px-3 disabled:opacity-50"
          >
            {loadingInfo ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Version", value: info.version ?? "—" },
            { label: "WASM Version", value: info.wasmVersion !== null ? `v${info.wasmVersion}` : "—" },
            { label: "Rating Fee", value: feeToUsdc(info.ratingFee) },
            { label: "Reg Fee", value: feeToUsdc(info.registrationFee) },
            { label: "Treasury Balance", value: feeToUsdc(info.treasuryBalance) },
          ].map((item) => (
            <div key={item.label} className="bg-stardust/30 rounded-xl px-4 py-3">
              <p className="text-xs text-ash uppercase tracking-wider mb-1">{item.label}</p>
              <p className="font-mono text-sm font-semibold text-moonlight">{item.value}</p>
            </div>
          ))}
        </div>
        {info.admin && (
          <div className="mt-3 bg-stardust/30 rounded-xl px-4 py-3">
            <p className="text-xs text-ash uppercase tracking-wider mb-1">Admin</p>
            <p className="font-mono text-xs text-plasma-bright break-all">{info.admin}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Set Rating Fee */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Set Rating Fee</h4>
          <p className="text-xs text-ash">Current: <span className="text-solar-bright">{feeToUsdc(info.ratingFee)}</span></p>
          <div className="flex gap-2">
            <input
              type="number" min="0" step="0.000001" placeholder="e.g. 0.1"
              value={newRatingFee}
              onChange={(e) => setNewRatingFee(e.target.value)}
              className="input-field flex-1 text-sm"
            />
            <span className="self-center text-xs text-ash">USDC</span>
          </div>
          <button
            disabled={busy || !newRatingFee}
            onClick={() => run("Rating fee updated", () => setRatingFeeOnChain(adminAddress, usdcToStroops(newRatingFee)))}
            className="btn-nova text-sm w-full disabled:opacity-50"
          >
            Update
          </button>
        </div>

        {/* Set Registration Fee */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Set Registration Fee</h4>
          <p className="text-xs text-ash">Current: <span className="text-solar-bright">{feeToUsdc(info.registrationFee)}</span></p>
          <div className="flex gap-2">
            <input
              type="number" min="0" step="0.000001" placeholder="e.g. 5.0"
              value={newRegFee}
              onChange={(e) => setNewRegFee(e.target.value)}
              className="input-field flex-1 text-sm"
            />
            <span className="self-center text-xs text-ash">USDC</span>
          </div>
          <button
            disabled={busy || !newRegFee}
            onClick={() => run("Registration fee updated", () => setRegistrationFeeOnChain(adminAddress, usdcToStroops(newRegFee)))}
            className="btn-nova text-sm w-full disabled:opacity-50"
          >
            Update
          </button>
        </div>

        {/* Set Treasury */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Set Treasury Address</h4>
          <input
            type="text" placeholder="G... address"
            value={newTreasury}
            onChange={(e) => setNewTreasury(e.target.value)}
            className="input-field text-sm font-mono"
          />
          <button
            disabled={busy || !newTreasury}
            onClick={() => run("Treasury updated", () => setTreasuryOnChain(adminAddress, newTreasury))}
            className="btn-nova text-sm w-full disabled:opacity-50"
          >
            Update Treasury
          </button>
        </div>

        {/* Withdraw Fees */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Withdraw Fees</h4>
          <p className="text-xs text-ash">
            Collected: <span className="text-aurora-bright font-semibold">{feeToUsdc(info.treasuryBalance)}</span>
          </p>
          <p className="text-xs text-ash/70">Sends all collected fees to the treasury address.</p>
          <button
            disabled={busy || !info.treasuryBalance || info.treasuryBalance <= BigInt(0)}
            onClick={() => run("Fees withdrawn", () => withdrawFeesOnChain(adminAddress))}
            className="btn-nova text-sm w-full disabled:opacity-50"
          >
            Withdraw to Treasury
          </button>
        </div>

        {/* Register Project */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Register Project On-Chain</h4>
          <input
            type="text" placeholder="Project ID (symbol, e.g. my_proj)"
            value={regProjectId}
            onChange={(e) => setRegProjectId(e.target.value)}
            className="input-field text-sm font-mono"
          />
          <input
            type="text" placeholder="Project account (G... address)"
            value={regAccountId}
            onChange={(e) => setRegAccountId(e.target.value)}
            className="input-field text-sm font-mono"
          />
          <p className="text-xs text-ash/70">Registration fee is paid from the admin wallet.</p>
          <button
            disabled={busy || !regProjectId || !regAccountId}
            onClick={() => run("Project registered", () => registerProjectOnChain(adminAddress, regProjectId, regAccountId))}
            className="btn-nova text-sm w-full disabled:opacity-50"
          >
            Register
          </button>
        </div>

        {/* Remove Project */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Remove Project From Chain</h4>
          <input
            type="text" placeholder="Project ID (symbol)"
            value={removeProjectId}
            onChange={(e) => setRemoveProjectId(e.target.value)}
            className="input-field text-sm font-mono"
          />
          <p className="text-xs text-ash/70">No fee refund. Ratings remain on-chain.</p>
          <button
            disabled={busy || !removeProjectId}
            onClick={() => run("Project removed", () => removeProjectOnChain(adminAddress, removeProjectId))}
            className="bg-supernova/15 hover:bg-supernova/25 text-supernova border border-supernova/20 font-medium text-sm px-4 py-2 rounded-xl transition-all w-full disabled:opacity-50"
          >
            Remove
          </button>
        </div>

        {/* Upgrade Version */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Upgrade Version String</h4>
          <p className="text-xs text-ash">Current: <span className="text-moonlight font-mono">{info.version ?? "—"}</span></p>
          <input
            type="text" placeholder="e.g. 1.2.0"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            className="input-field text-sm font-mono"
          />
          <button
            disabled={busy || !newVersion}
            onClick={() => run("Version updated", () => upgradeVersionOnChain(adminAddress, newVersion))}
            className="btn-nova text-sm w-full disabled:opacity-50"
          >
            Update Version
          </button>
        </div>

        {/* Transfer Admin */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h4 className="font-medium text-starlight text-sm">Transfer Admin</h4>
          <p className="text-xs text-supernova/80 font-medium">⚠ Irreversible — double-check the address.</p>
          <input
            type="text" placeholder="New admin G... address"
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            className="input-field text-sm font-mono"
          />
          <button
            disabled={busy || !newAdmin}
            onClick={() => run("Admin transferred", () => transferAdminOnChain(adminAddress, newAdmin))}
            className="bg-supernova/15 hover:bg-supernova/25 text-supernova border border-supernova/20 font-medium text-sm px-4 py-2 rounded-xl transition-all w-full disabled:opacity-50"
          >
            Transfer Admin Rights
          </button>
        </div>
      </div>
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

  if (!user || !hasMinRole(user.role, "admin")) {
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
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar/30 to-nova/30 border border-solar/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="font-display font-bold text-3xl text-starlight">Admin Dashboard</h1>
          </div>
          <a
            href="https://github.com/samieazubike/stellar-wave-hub/blob/main/docs/MAINTAINERS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm !py-2 !px-3"
          >
            Maintainer Guide
          </a>
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
            <TabsTrigger value="contract">
              Contract
              {ON_CHAIN_ENABLED && (
                <span className="ml-2 bg-plasma/15 text-plasma-bright text-xs px-2 py-0.5 rounded-md">
                  on-chain
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="promos">Promo Codes</TabsTrigger>
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

          {/* ── Contract tab ── */}
          <TabsContent value="contract">
            {user?.stellar_address ? (
              <ContractPanel adminAddress={user.stellar_address} />
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-solar/10 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-moonlight mb-2">Stellar wallet required</h3>
                <p className="text-ash text-sm mb-4">
                  Link a Stellar wallet in your profile to manage the registry contract.
                </p>
                <Link href="/profile" className="btn-ghost inline-flex text-sm">Go to Profile</Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="promos">
            <PromoCodesTab token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}