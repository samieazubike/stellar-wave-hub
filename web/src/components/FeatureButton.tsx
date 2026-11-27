"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FEATURED_DURATIONS, type FeaturedTier } from "@/lib/featured-pricing";
import { payWithFreighter } from "@/lib/payments-client";
import { PayFallback } from "@/components/PayFallback";
import { PromoCodeInput } from "@/components/PromoCodeInput";
import { XlmPrice } from "@/components/XlmPrice";

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
  const [promo, setPromo] = useState<{
    days: number;
    code: string | null;
    price: number;
  } | null>(null);

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
  const selectedPromo = promo?.days === selectedDays ? promo : null;
  const priceXlm = selectedPromo?.price ?? selectedTier?.priceXlm ?? 0;
  const handlePromoApply = useCallback((code: string | null, finalPrice: number) => {
    setPromo({ days: selectedDays, code, price: finalPrice });
  }, [selectedDays]);

  async function requestActivation(txHash?: string) {
    if (!token) return;

    const response = await fetch("/api/featured/activate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: projectId,
        days: selectedDays,
        ...(txHash ? { tx_hash: txHash } : {}),
        ...(selectedPromo?.code ? { promo_code: selectedPromo.code } : {}),
      }),
    });
    const data = (await response.json()) as { error?: string; expires_at?: string };
    if (!response.ok) {
      throw new Error(data.error || "Featured placement could not be activated.");
    }
    if (!data.expires_at || Number.isNaN(Date.parse(data.expires_at))) {
      throw new Error("Featured placement was activated, but its expiry could not be confirmed.");
    }

    const expiresAt = data.expires_at;
    onActivated(expiresAt);
    setMessage(`Featured until ${new Date(expiresAt).toLocaleString()}.`);
    setOpen(false);
  }

  async function verifyAndActivate(txHash: string) {
    if (!token) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await requestActivation(txHash);
    } catch (reason) {
      setError(
        `${reason instanceof Error ? reason.message : "Featured placement could not be activated."} Payment transaction: ${txHash}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function activate() {
    if (!token || !config || !selectedTier) return;

    setBusy(true);
    setError("");
    setMessage("");

    let txHash: string | undefined;
    try {
      if (priceXlm > 0) {
        if (!config.destination) {
          throw new Error("Featured payments are not configured yet.");
        }
        txHash = await payWithFreighter({
          amountXlm: priceXlm,
          destination: config.destination,
          network: config.network,
          horizonUrl: config.horizonUrl,
          memo: "spotlight",
        });
      }
      await requestActivation(txHash);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Could not activate featured placement.";
      setError(
        txHash && !message.includes(txHash)
          ? `${message} Payment transaction: ${txHash}.`
          : message,
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
        {open ? "Close feature options" : "Feature this project"}
      </button>
      {message && (
        <p role="status" className="mt-2 text-xs text-aurora-bright">
          {message}
        </p>
      )}

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
                <span className="font-semibold text-nova-bright inline-flex items-center">
                  {tier.priceXlm} XLM
                  <XlmPrice amount={tier.priceXlm} />
                </span>
              </label>
            ))}
          </fieldset>

          {selectedTier && (
            <div className="mt-4">
              <PromoCodeInput
                key={selectedDays}
                basePrice={selectedTier.priceXlm}
                onApply={handlePromoApply}
              />
            </div>
          )}

          {config && !config.destination && (
            <p className="mt-3 text-xs text-ash">
              {priceXlm > 0
                ? "Payments are not configured yet."
                : "This promo covers the full price; no payment is needed."}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 break-words text-xs text-supernova">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={activate}
            disabled={busy || !selectedTier || (priceXlm > 0 && !config?.destination) || !token}
            className="btn-nova mt-4 w-full justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Processing featured placement..."
              : selectedTier
                ? priceXlm > 0
                  ? `Pay ${priceXlm} XLM`
                  : "Activate feature"
                : "Loading prices..."}
          </button>

          {config?.destination && selectedTier && priceXlm > 0 && (
            <PayFallback
              destination={config.destination}
              amountXlm={priceXlm}
              memo="spotlight"
              disabled={busy || !token}
              onVerifyTxHash={verifyAndActivate}
            />
          )}
        </div>
      )}
    </div>
  );
}