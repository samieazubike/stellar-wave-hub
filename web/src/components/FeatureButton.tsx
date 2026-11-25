"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FEATURED_DURATIONS, type FeaturedTier } from "@/lib/featured-pricing";
import { payWithFreighter } from "@/lib/payments-client";

interface FeaturedConfig {
  tiers: FeaturedTier[];
  destination: string | null;
  network: "mainnet" | "testnet";
  horizonUrl: string;
}

interface FeatureButtonProps {
  projectId: number;
  onActivated: (expiresAt: string) => void;
}

export function FeatureButton({ projectId, onActivated }: FeatureButtonProps) {
  const { token } = useAuth();
  const [config, setConfig] = useState<FeaturedConfig | null>(null);
  const [selectedDays, setSelectedDays] =
    useState<(typeof FEATURED_DURATIONS)[number]>(30);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/featured/config")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load spotlight prices.");
        if (!cancelled) setConfig(data as FeaturedConfig);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load spotlight prices.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTier = config?.tiers.find((tier) => tier.days === selectedDays);

  async function activate() {
    if (!token || !config || !selectedTier) return;
    if (!config.destination) {
      setError("Spotlight payments are not configured yet.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    let txHash: string;
    try {
      txHash = await payWithFreighter({
        amountXlm: selectedTier.priceXlm,
        destination: config.destination,
        network: config.network,
        horizonUrl: config.horizonUrl,
        memo: "spotlight",
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send spotlight payment.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/featured/activate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_id: projectId, days: selectedDays, tx_hash: txHash }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Payment was sent but the spotlight could not be activated.");
      }
      onActivated(data.expires_at);
      setMessage(`${selectedDays}-day spotlight activated.`);
      setOpen(false);
    } catch (reason) {
      setError(
        `${reason instanceof Error ? reason.message : "Spotlight activation failed."} Payment transaction: ${txHash}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        className="btn-ghost text-sm !py-1.5 !px-3"
        onClick={() => {
          setOpen((value) => !value);
          setError("");
          setMessage("");
        }}
        aria-expanded={open}
      >
        {open ? "Close spotlight options" : "Choose spotlight"}
      </button>

      {open && (
        <div className="mt-3 w-full sm:w-[22rem] rounded-xl border border-nova/20 bg-space/90 p-4">
          <fieldset disabled={busy || !config} className="space-y-2">
            <legend className="mb-3 text-sm font-semibold text-starlight">
              Spotlight duration
            </legend>
            {config?.tiers.map((tier) => (
              <label
                key={tier.days}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                  selectedDays === tier.days
                    ? "border-nova/60 bg-nova/10"
                    : "border-dust/20 hover:border-dust/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`spotlight-${projectId}`}
                    value={tier.days}
                    checked={selectedDays === tier.days}
                    onChange={() => setSelectedDays(tier.days)}
                    className="accent-[var(--nova)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-moonlight">
                      {tier.days} days
                    </span>
                    <span className="text-xs text-ash">
                      {tier.days === 7
                        ? "A week in the spotlight"
                        : tier.days === 30
                          ? "Stay visible all month"
                          : "Maximum time, best daily rate"}
                    </span>
                  </span>
                </span>
                <span className="font-semibold text-nova-bright">{tier.priceXlm} XLM</span>
              </label>
            ))}
          </fieldset>

          {config && !config.destination && (
            <p className="mt-3 text-xs text-supernova">
              Spotlight payments are not configured yet.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 break-words text-xs text-supernova">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="mt-3 text-xs text-aurora-bright">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={activate}
            disabled={busy || !selectedTier || !config?.destination || !token}
            className="btn-nova mt-4 w-full justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Confirming payment..."
              : selectedTier
                ? `Pay ${selectedTier.priceXlm} XLM`
                : "Loading prices..."}
          </button>
        </div>
      )}
    </div>
  );
}