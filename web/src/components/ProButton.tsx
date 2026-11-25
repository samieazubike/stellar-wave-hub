"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isPro } from "@/lib/pro";
import { payWithFreighter } from "@/lib/payments-client";

interface ProConfig {
  priceXlm: number;
  destination: string | null;
  network: "mainnet" | "testnet";
  horizonUrl: string;
}

export function ProButton({
  projectId,
  proUntil,
  onActivated,
}: {
  projectId: number;
  proUntil?: string | null;
  onActivated: (proUntil: string) => void;
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function purchase() {
    if (!token) return;

    setBusy(true);
    setError("");
    let txHash: string | null = null;
    try {
      const configResponse = await fetch(`/api/projects/${projectId}/pro`);
      const config = (await configResponse.json()) as ProConfig & { error?: string };
      if (!configResponse.ok) {
        throw new Error(config.error || "Could not load Pro pricing.");
      }
      if (!config.destination) {
        throw new Error("Pro payments are not configured yet.");
      }

      txHash = await payWithFreighter({
        amountXlm: config.priceXlm,
        destination: config.destination,
        network: config.network,
        horizonUrl: config.horizonUrl,
        memo: `pro:${projectId}`,
      });

      const response = await fetch(`/api/projects/${projectId}/pro`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tx_hash: txHash }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `${data.error || "Pro could not be activated."} Payment transaction: ${txHash}.`,
        );
      }
      onActivated(data.pro_until);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Could not complete the Pro purchase.";
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
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={purchase}
        disabled={busy || !token}
        className="btn-ghost text-sm !py-1.5 !px-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? "Confirming payment..."
          : isPro({ pro_until: proUntil })
            ? "Renew Pro"
            : "Upgrade to Pro"}
      </button>
      {error && (
        <p role="alert" className="max-w-56 break-words text-xs text-supernova">
          {error}
        </p>
      )}
    </div>
  );
}
