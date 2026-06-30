"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
import type { ApprovalRequest } from "@/types/approval";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  feature: { label: "Mark Featured", color: "text-solar-bright" },
  unfeature: { label: "Remove from Featured", color: "text-ash" },
  delete: { label: "Delete Project", color: "text-supernova" },
};

function ReviewDialog({
  item,
  currentUserId: currentUserId,
  onApprove,
  onReject,
  isPending,
}: {
  item: ApprovalRequest;
  currentUserId: number;
  onApprove: (requestId: number, note: string) => void;
  onReject: (requestId: number, note: string) => void;
  isPending: boolean;
}) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const isSelf = item.requested_by === currentUserId;
  const meta = ACTION_LABELS[item.action_type] ?? { label: item.action_type, color: "text-moonlight" };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          disabled={isPending}
          className="bg-aurora/15 hover:bg-aurora/25 text-aurora-bright border border-aurora/20 font-medium text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          Review
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Review approval request</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-moonlight font-medium">{item.requester_username}</span> requested to{" "}
                <span className={`font-semibold ${meta.color}`}>{meta.label}</span>{" "}
                <span className="text-moonlight font-medium">&ldquo;{item.project_name}&rdquo;</span>.
              </p>
              {item.reason && (
                <p className="text-ash italic">&ldquo;{item.reason}&rdquo;</p>
              )}
              {isSelf && (
                <p className="text-supernova font-medium">
                  ⚠ You submitted this request and cannot review it yourself.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium text-moonlight">
            Note <span className="text-ash">(optional)</span>
          </label>
          <Textarea
            placeholder="Add a note for the audit log..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            disabled={isSelf}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setNote("")}>Cancel</AlertDialogCancel>
          <button
            disabled={isSelf || isPending}
            onClick={() => {
              onReject(item.id, note);
              setNote("");
              setOpen(false);
            }}
            className="bg-supernova/15 hover:bg-supernova/25 text-supernova border border-supernova/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            Reject
          </button>
          <AlertDialogAction
            disabled={isSelf || isPending}
            onClick={() => {
              onApprove(item.id, note);
              setNote("");
              setOpen(false);
            }}
            className="disabled:opacity-50"
          >
            Approve &amp; Execute
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ApprovalQueue({
  token,
  currentUserId,
}: {
  token: string | null;
  currentUserId: number;
}) {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<ApprovalRequest[]>({
    queryKey: ["approval-requests", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/approval-requests?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch approval requests");
      const data = await res.json();
      return data.approvalRequests || [];
    },
    enabled: !!token,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      decision,
      note,
    }: {
      requestId: number;
      decision: "approve" | "reject";
      note: string;
    }) => {
      const res = await fetch(`/api/approval-requests/${requestId}/${decision}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: note || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Review failed");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--aurora)" strokeWidth="1.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg text-moonlight mb-2">No pending approvals</h3>
        <p className="text-ash">Sensitive actions awaiting a second admin will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviewMutation.isError && (
        <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm">
          {reviewMutation.error.message}
        </div>
      )}
      {items.map((item) => {
        const meta = ACTION_LABELS[item.action_type] ?? { label: item.action_type, color: "text-moonlight" };
        return (
          <div
            key={item.id}
            className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all hover:border-dust/40"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Link
                  href={`/projects/${item.project_slug}`}
                  className="font-medium text-starlight hover:text-nova-bright transition-colors truncate"
                  target="_blank"
                >
                  {item.project_name}
                </Link>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md bg-stardust/50 border border-dust/20 ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="tag text-xs bg-solar/10 text-solar-bright border border-solar/20">
                  pending
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ash">
                <span>
                  requested by{" "}
                  <span className="text-moonlight">{item.requester_username}</span>
                  {item.requested_by === currentUserId && (
                    <span className="ml-1 text-solar-bright">(you)</span>
                  )}
                </span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              {item.reason && (
                <p className="text-xs text-ash/70 italic mt-1 truncate max-w-[300px]">
                  &ldquo;{item.reason}&rdquo;
                </p>
              )}
            </div>

            <div className="shrink-0">
              <ReviewDialog
                item={item}
                currentUserId={currentUserId}
                isPending={reviewMutation.isPending}
                onApprove={(id, note) =>
                  reviewMutation.mutate({ requestId: id, decision: "approve", note })
                }
                onReject={(id, note) =>
                  reviewMutation.mutate({ requestId: id, decision: "reject", note })
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
