"use client";

import { useState } from "react";
import { payForSpotlight } from "@/lib/payForSpotlight";

export default function FeatureButton({
  projectId,
  featuredUntil,
  // keeping these in props lets the parent send them, but they don't affect UI logic
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  featuredTxHash,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  featured,

  disabled,
}: {
  projectId: number;
  featuredUntil?: string | null;
  featuredTxHash?: string | null;
  featured?: number;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  // Avoid react-hooks/purity rule violations around Date.now().
  // We treat non-null featuredUntil as active; parent sorting/refresh handles expiry.
  const isActive = Boolean(featuredUntil);





  const label = isActive
    ? `Featured until ${new Date(featuredUntil as string).toLocaleDateString()}`
    : "Feature this project";

  const onClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const txHash = await payForSpotlight(projectId);
      const res = await fetch("/api/featured/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, txHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Activation failed");
      // Refresh to reflect new featured_until
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process payment";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || isActive}
      className="btn-nova text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Processing…" : label}
    </button>
  );
}

