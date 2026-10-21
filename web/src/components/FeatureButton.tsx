"use client";

import { useEffect, useState } from "react";
import { payWithFreighter } from "@/lib/payments-client";
import type { FeaturedTier, StellarNetwork } from "@/lib/featured-pricing";

interface FeatureButtonProps {
  projectId: number;
  token: string;
  stellarAddress?: string;
  onActivated: () => void;
}

interface FeaturedConfig {
  tiers: FeaturedTier[];
  paymentAddress: string | null;
  network: StellarNetwork;
}

export function FeatureButton({
  projectId,
  token,
  stellarAddress,
  onActivated,
}: FeatureButtonProps) {
  const [config, setConfig] = useState<FeaturedConfig | null>(null);
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [pendingDays, setPendingDays] = useState<number | null>(null);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/featured/config")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load spotlight tiers");
        if (!cancelled) {
          setConfig(data);
          setSelectedDays(data.tiers[0]?.days ?? null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load spotlight tiers");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingConfig(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTier = config?.tiers.find((tier) => tier.days === selectedDays);

  const activate = async () => {
    if (!config || !selectedTier || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let transactionHash = pendingTxHash;
      if (!transactionHash) {
        if (!config.paymentAddress) {
          throw new Error("Spotlight payments are not configured. Please contact support.");
        }
        if (!stellarAddress) {
          throw new Error("Link your Stellar wallet in your profile before purchasing a spotlight.");
        }
        transactionHash = await payWithFreighter({
          amountXlm: selectedTier.priceXlm,
          destination: config.paymentAddress,
          network: config.network,
        });
        setPendingTxHash(transactionHash);
        setPendingDays(selectedTier.days);
      }

      const response = await fetch("/api/featured/activate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          days: pendingDays ?? selectedTier.days,
          tx_hash: transactionHash,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Spotlight activation failed");

      setPendingTxHash(null);
      setPendingDays(null);
      setSuccess(`Spotlight active until ${new Date(data.expires_at).toLocaleDateString()}.`);
      onActivated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Spotlight activation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full sm:w-64 space-y-2">
      {isLoadingConfig ? (
        <p className="text-xs text-ash">Loading spotlight tiers...</p>
      ) : config ? (
        <>
          <label className="block text-xs font-medium text-ash" htmlFor={`spotlight-tier-${projectId}`}>
            Spotlight duration
          </label>
          <select
            id={`spotlight-tier-${projectId}`}
            className="input-field w-full text-sm"
            value={selectedDays ?? ""}
            disabled={isSubmitting || Boolean(pendingTxHash)}
            onChange={(event) => setSelectedDays(Number(event.target.value))}
          >
            {config.tiers.map((tier) => (
              <option key={tier.days} value={tier.days}>
                {tier.days} days · {tier.priceXlm} XLM
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-nova w-full text-sm disabled:opacity-50"
            disabled={!selectedTier || isSubmitting || isLoadingConfig}
            onClick={activate}
          >
            {isSubmitting
              ? pendingTxHash
                ? "Verifying payment..."
                : `Confirm ${selectedTier?.priceXlm ?? ""} XLM in Freighter...`
              : pendingTxHash
                ? "Retry payment verification"
                : selectedTier
                  ? `Spotlight · ${selectedTier.priceXlm} XLM`
                  : "Spotlight"}
          </button>
          {pendingTxHash && (
            <p className="text-xs text-ash">
              Payment sent; retry verification if activation does not complete.
            </p>
          )}
        </>
      ) : null}
      {error && <p className="text-xs text-supernova" role="alert">{error}</p>}
      {success && <p className="text-xs text-aurora-bright" role="status">{success}</p>}
    </div>
  );
}
