"use client";

import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import QRCode from "qrcode";
import { formatXlmAmount } from "@/lib/featured-pricing";
import { buildSep7PayUri } from "@/lib/payments-client";

const QR_OPTIONS = { errorCorrectionLevel: "M" as const, margin: 2, width: 256 };
const TX_HASH_REGEX = /^[a-f0-9]{64}$/i;

export interface PayFallbackProps {
  destination: string;
  amountXlm: number;
  memo?: string;
  disabled?: boolean;
  onVerifyTxHash: (txHash: string) => Promise<void>;
}

export function PayFallback({
  destination,
  amountXlm,
  memo,
  disabled = false,
  onVerifyTxHash,
}: PayFallbackProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [validationError, setValidationError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const payUri = useMemo(
    () => buildSep7PayUri({ destination, amountXlm, memo }),
    [destination, amountXlm, memo],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(payUri, QR_OPTIONS)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, payUri]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = txHash.trim();
    if (!TX_HASH_REGEX.test(trimmed)) {
      setValidationError("Enter a valid 64-character Stellar transaction hash.");
      return;
    }

    setValidationError("");
    setVerifying(true);
    try {
      await onVerifyTxHash(trimmed);
      setTxHash("");
    } finally {
      setVerifying(false);
    }
  }

  const isBusy = disabled || verifying;

  return (
    <div className="mt-3 border-t border-dust/20 pt-3">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setValidationError("");
        }}
        aria-expanded={open}
        className="w-full text-center text-xs text-ash transition-colors hover:text-moonlight"
      >
        {open ? "Hide mobile wallet / QR option" : "No Freighter? Pay with QR or wallet link"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg border border-dust/20 bg-void/60 p-3">
          <div className="flex flex-col items-center gap-2 text-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser
              <img
                src={qrDataUrl}
                alt={`Stellar payment QR code for ${formatXlmAmount(amountXlm)} XLM`}
                width={144}
                height={144}
                className="rounded-lg bg-white p-1"
              />
            ) : (
              <div className="skeleton h-36 w-36 rounded-lg" />
            )}

            <a
              href={payUri}
              className="btn-ghost w-full justify-center !py-1.5 text-xs"
            >
              Open in Stellar wallet
            </a>

            <p className="text-[11px] leading-relaxed text-ash">
              Send <span className="font-medium text-moonlight">{formatXlmAmount(amountXlm)} XLM</span>
              {memo ? (
                <>
                  {" "}with memo <code className="text-moonlight">{memo}</code>
                </>
              ) : null}
              .
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <label htmlFor={inputId} className="block text-xs font-medium text-moonlight">
              I&apos;ve paid, here is the tx hash
            </label>
            <input
              id={inputId}
              type="text"
              value={txHash}
              onChange={(event) => {
                setTxHash(event.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="Paste 64-character Stellar tx hash"
              disabled={isBusy}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-dust/30 bg-space/90 px-2.5 py-1.5 font-mono text-xs text-starlight placeholder:text-ash/70 focus:border-nova/60 focus:outline-none disabled:opacity-50"
            />
            {validationError && (
              <p role="alert" className="text-xs text-supernova">
                {validationError}
              </p>
            )}
            <button
              type="submit"
              disabled={isBusy || !txHash.trim()}
              className="btn-ghost w-full justify-center !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? "Verifying payment..." : "Verify payment"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
