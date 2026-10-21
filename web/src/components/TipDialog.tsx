"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { payWithFreighter } from "@/lib/payments-client";

// ── Types ────────────────────────────────────────────────────────────────────

interface TipDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called to close the dialog. */
  onOpenChange: (open: boolean) => void;
  /** The project receiving the tip. */
  project: {
    id: number;
    name: string;
    stellar_account_id: string;
    slug: string;
  };
  /** JWT token for the authenticated user. */
  token: string;
  /** Sender's Stellar public key (from Freighter / user profile). */
  senderAddress: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_AMOUNTS = [5, 10, 25] as const;
const MIN_CUSTOM = 1;
const MAX_CUSTOM = 10_000;

type Step = "idle" | "paying" | "recording" | "success" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMemo(slug: string): string {
  // "tip:" + slug, truncated to 28 bytes (Stellar text-memo limit)
  return `tip:${slug}`.slice(0, 28);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TipDialog({
  open,
  onOpenChange,
  project,
  token,
  senderAddress,
}: TipDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [confirmedAmount, setConfirmedAmount] = useState<string | null>(null);

  // Resolve the amount to send
  const amountXlm =
    selectedPreset !== null
      ? selectedPreset
      : parseFloat(customAmount) || 0;

  const isValidAmount = amountXlm >= MIN_CUSTOM && amountXlm <= MAX_CUSTOM;

  function reset() {
    setStep("idle");
    setErrorMsg("");
    setTxHash(null);
    setConfirmedAmount(null);
    setSelectedPreset(10);
    setCustomAmount("");
  }

  function handleClose(value: boolean) {
    if (step === "paying" || step === "recording") return; // block close during flow
    if (!value) reset();
    onOpenChange(value);
  }

  async function handleTip() {
    if (!isValidAmount) return;

    setStep("paying");
    setErrorMsg("");
    setTxHash(null);

    let hash: string;
    try {
      hash = await payWithFreighter({
        fromAddress: senderAddress,
        toAddress: project.stellar_account_id,
        amountXlm,
        memo: buildMemo(project.slug),
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setStep("error");
      return;
    }

    setTxHash(hash);
    setStep("recording");

    // Record on the Hub
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ project_id: project.id, tx_hash: hash }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The payment landed on-chain regardless — surface a warning but
        // don't treat it as a blocking error from the user's perspective.
        console.warn("Tip recording warning:", data.error);
      }
      setConfirmedAmount(data.amount_xlm ?? String(amountXlm));
    } catch (err) {
      console.warn("Tip recording error (payment still landed):", err);
      setConfirmedAmount(String(amountXlm));
    }

    setStep("success");
  }

  const explorerBase =
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_STELLAR_NETWORK === "testnet" ||
      process.env.NEXT_PUBLIC_HORIZON_URL?.includes("testnet"))
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        {/* ── Success ─────────────────────────────────────────────────────── */}
        {step === "success" ? (
          <>
            <AlertDialogHeader>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-aurora/10 border border-aurora/20 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--aurora-bright)"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <AlertDialogTitle className="text-center">
                Tip sent! 🎉
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {confirmedAmount
                  ? `${parseFloat(confirmedAmount).toLocaleString()} XLM`
                  : `${amountXlm} XLM`}{" "}
                landed in{" "}
                <span className="text-starlight font-medium">{project.name}</span>
                &apos;s account.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {txHash && (
              <div className="mt-2 mb-4 flex justify-center">
                <a
                  href={`${explorerBase}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tag tag-plasma text-[11px] inline-flex items-center gap-1.5"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View on Stellar Expert
                </a>
              </div>
            )}

            <AlertDialogFooter>
              <button
                className="btn-nova w-full"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Done
              </button>
            </AlertDialogFooter>
          </>
        ) : (
          /* ── Normal / Error ─────────────────────────────────────────────── */
          <>
            <AlertDialogHeader>
              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-solar/10 border border-solar/20 flex items-center justify-center">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--solar-bright)"
                  strokeWidth="1.8"
                >
                  {/* Heart / tip icon */}
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>

              <AlertDialogTitle className="text-center">
                Tip {project.name}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Send XLM directly to this project&apos;s Stellar account.
                Tips are recorded on-chain and visible in the ledger.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Preset amounts */}
            <div className="mt-4 mb-3">
              <p className="text-xs font-medium text-ash uppercase tracking-wider mb-2">
                Choose an amount
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(amount);
                      setCustomAmount("");
                    }}
                    className={`rounded-xl border py-3 text-sm font-semibold transition-all ${
                      selectedPreset === amount
                        ? "border-nova bg-nova/10 text-nova-bright"
                        : "border-dust/40 text-ash hover:border-nova/40 hover:text-moonlight"
                    }`}
                  >
                    {amount} XLM
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="mb-4">
              <p className="text-xs font-medium text-ash uppercase tracking-wider mb-2">
                Or enter a custom amount
              </p>
              <div className="relative">
                <input
                  type="number"
                  min={MIN_CUSTOM}
                  max={MAX_CUSTOM}
                  step="0.01"
                  placeholder={`Min ${MIN_CUSTOM} XLM`}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="input-field pr-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ash pointer-events-none">
                  XLM
                </span>
              </div>
              {customAmount && !isValidAmount && (
                <p className="text-xs text-supernova mt-1.5">
                  Amount must be between {MIN_CUSTOM} and {MAX_CUSTOM.toLocaleString()} XLM.
                </p>
              )}
            </div>

            {/* Memo preview */}
            <div className="mb-4 rounded-xl bg-stardust/40 px-4 py-3 flex items-center gap-2 text-xs text-ash">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 opacity-60"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>
                Memo:{" "}
                <span className="font-mono text-moonlight">
                  {buildMemo(project.slug)}
                </span>
              </span>
            </div>

            {/* Error message */}
            {step === "error" && errorMsg && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm bg-supernova/10 border border-supernova/20 text-supernova">
                {errorMsg}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={step === "paying" || step === "recording"}>
                Cancel
              </AlertDialogCancel>
              <button
                type="button"
                onClick={handleTip}
                disabled={
                  !isValidAmount ||
                  step === "paying" ||
                  step === "recording"
                }
                className="btn-nova disabled:opacity-50 min-w-[120px] inline-flex items-center justify-center gap-2"
              >
                {step === "paying" ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="animate-spin shrink-0"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Confirm in wallet…
                  </>
                ) : step === "recording" ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="animate-spin shrink-0"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Recording…
                  </>
                ) : (
                  <>
                    Send {isValidAmount ? `${amountXlm} XLM` : "Tip"}
                  </>
                )}
              </button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
