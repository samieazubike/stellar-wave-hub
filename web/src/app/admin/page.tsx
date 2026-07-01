"use client";

import {useCallback, useEffect, useState} from "react";
import {useAuth} from "@/context/AuthContext";
import {canFeatureProjects, canReviewProjects} from "@/lib/rbac";
import {PROJECT_CATEGORIES} from "@/lib/categories";
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

interface CategoryOption {
	value: string;
	label: string;
}

interface MaintainerAssignment {
	id: number;
	username: string;
	email: string | null;
	categories: string[];
}

export default function AdminPage() {
	const {user, token} = useAuth();
	const [pending, setPending] = useState<Project[]>([]);
	const [assignedCategories, setAssignedCategories] = useState<
		string[] | null
	>(null);
	const [maintainers, setMaintainers] = useState<MaintainerAssignment[]>([]);
	const [assignmentCategories, setAssignmentCategories] =
		useState<CategoryOption[]>([...PROJECT_CATEGORIES]);
	const [loading, setLoading] = useState(true);
	const [assignmentsLoading, setAssignmentsLoading] = useState(false);
	const [savingMaintainerId, setSavingMaintainerId] = useState<number | null>(
		null,
	);
	const [actionLoading, setActionLoading] = useState<number | null>(null);

	const fetchPending = useCallback(async () => {
		try {
			const res = await fetch("/api/projects/pending", {
				headers: {Authorization: `Bearer ${token}`},
			});
			if (res.ok) {
				const data = await res.json();
				setPending(data.projects || []);
				setAssignedCategories(data.assignedCategories ?? null);
			}
		} catch {}
		setLoading(false);
	}, [token]);

	const fetchMaintainerAssignments = useCallback(async () => {
		setAssignmentsLoading(true);
		try {
			const res = await fetch("/api/admin/maintainer-categories", {
				headers: {Authorization: `Bearer ${token}`},
			});
			if (res.ok) {
				const data = await res.json();
				setMaintainers(data.maintainers || []);
				setAssignmentCategories(data.categories || [
					...PROJECT_CATEGORIES,
				]);
			}
		} catch {}
		setAssignmentsLoading(false);
	}, [token]);

	useEffect(() => {
		if (!token) {
			setLoading(false);
			return;
		}
		fetchPending();
	}, [fetchPending, token]);

	useEffect(() => {
		if (!token || user?.role !== "admin") return;
		fetchMaintainerAssignments();
	}, [fetchMaintainerAssignments, token, user?.role]);

	const toggleMaintainerCategory = async (
		maintainer: MaintainerAssignment,
		category: string,
	) => {
		const nextCategories = maintainer.categories.includes(category)
			? maintainer.categories.filter((item) => item !== category)
			: [...maintainer.categories, category];

		setSavingMaintainerId(maintainer.id);
		try {
			const res = await fetch("/api/admin/maintainer-categories", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					maintainerId: maintainer.id,
					categories: nextCategories,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				setMaintainers((prev) =>
					prev.map((item) =>
						item.id === maintainer.id
							? {...item, categories: data.categories || []}
							: item,
					),
				);
			}
		} catch {}
		setSavingMaintainerId(null);
	};

	const categoryLabel = (value: string) => {
		return (
			PROJECT_CATEGORIES.find((category) => category.value === value)
				?.label || value
		);
	};

	const handleAction = async (
		projectId: number,
		action: "approve" | "reject",
		extra?: {featured?: boolean; reason?: string},
	) => {
		setActionLoading(projectId);
		try {
			const res = await fetch(`/api/projects/${projectId}/${action}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(extra || {}),
			});
			if (res.ok) {
				setPending((prev) => prev.filter((p) => p.id !== projectId));
			}
		} catch {}
		setActionLoading(null);
	};

	if (!user || !canReviewProjects(user.role)) {
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
						Reviewer access required
					</h2>
					<p className="text-ash mb-6">
						You need maintainer or admin privileges to view this page
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
					Review Queue
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

			{assignedCategories && (
				<div className="glass rounded-2xl p-5 mb-10 animate-in animate-in-delay-1">
					<p className="text-xs uppercase tracking-[0.18em] text-ash mb-3">
						Your moderation scope
					</p>
					<div className="flex flex-wrap gap-2">
						{assignedCategories.length > 0 ? (
							assignedCategories.map((category) => (
								<span key={category} className="tag tag-nova">
									{categoryLabel(category)}
								</span>
							))
						) : (
							<p className="text-sm text-ash">
								No categories assigned yet
							</p>
						)}
					</div>
				</div>
			)}

			{user.role === "admin" && (
				<div className="glass rounded-2xl p-6 mb-10 animate-in animate-in-delay-2">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
						<div>
							<h2 className="font-semibold text-xl text-starlight">
								Maintainer Categories
							</h2>
							<p className="text-sm text-ash mt-1">
								Assign maintainers to the categories they can moderate
							</p>
						</div>
						<button
							onClick={fetchMaintainerAssignments}
							disabled={assignmentsLoading}
							className="btn-ghost text-sm !py-2 !px-3 disabled:opacity-50"
						>
							Refresh
						</button>
					</div>

					{assignmentsLoading ? (
						<div className="space-y-3">
							{[...Array(2)].map((_, i) => (
								<div
									key={i}
									className="skeleton h-24 rounded-2xl"
								/>
							))}
						</div>
					) : maintainers.length > 0 ? (
						<div className="space-y-4">
							{maintainers.map((maintainer) => (
								<div
									key={maintainer.id}
									className="rounded-2xl border border-dust/30 bg-stardust/20 p-4"
								>
									<div className="flex flex-col lg:flex-row lg:items-start gap-4">
										<div className="lg:w-56 shrink-0">
											<p className="font-medium text-moonlight">
												{maintainer.username}
											</p>
											{maintainer.email && (
												<p className="text-xs text-ash mt-1 break-all">
													{maintainer.email}
												</p>
											)}
										</div>
										<div className="flex flex-wrap gap-2">
											{assignmentCategories.map(
												(category) => {
													const selected =
														maintainer.categories.includes(
															category.value,
														);
													return (
														<button
															key={
																category.value
															}
															onClick={() =>
																toggleMaintainerCategory(
																	maintainer,
																	category.value,
																)
															}
															disabled={
																savingMaintainerId ===
																maintainer.id
															}
															className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 ${
																selected
																	? "bg-nova/20 border-nova/30 text-nova-bright"
																	: "bg-stardust/40 border-dust/30 text-ash hover:text-moonlight hover:border-dust"
															}`}
														>
															{category.label}
														</button>
													);
												},
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-ash">
							No maintainer users found
						</p>
					)}
				</div>
			)}

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
										{canFeatureProjects(user.role) && (
											<button
												disabled={
													actionLoading ===
													project.id
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
										)}
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
					<div clahttps://github.com/samieazubike/stellar-wave-hub/pull/280/conflict?name=web%252Fsrc%252Fapp%252Fadmin%252Fpage.tsx&ancestor_oid=03fb3ce07d5dd4292372d90d2131a1add2a199a9&base_oid=daf1d253330d4e2ac4cb65d4513ad858b266c9fb&head_oid=141db11e68765cf89e944c7a2d3317fa1b0c93d2ssName="glass rounded-2xl p-12 text-center">
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
