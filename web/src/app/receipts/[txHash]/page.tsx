"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Receipt {
  tx_hash: string;
  product: string;
  project: { name: string; slug: string } | null;
  amount_xlm: number;
  created_at: string;
  payer_address: string;
  stellar_expert_url: string;
}

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ txHash: string }>;
}) {
  const { txHash } = use(params);
  const { token, loading: authLoading } = useAuth();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    setError("");

    fetch(`/api/payments/${encodeURIComponent(txHash)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load receipt");
        setReceipt(data.receipt);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load receipt");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [authLoading, token, txHash]);

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ash">
        Loading receipt...
      </div>
    );
  }

  if (notFound || error || !receipt) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
        <div className="glass w-full rounded-2xl p-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ash">
            Payment receipt
          </p>
          <h1 className="font-display text-2xl font-semibold text-starlight">
            {notFound ? "Receipt not found" : "Receipt unavailable"}
          </h1>
          <p className="mt-3 text-sm text-ash">
            {notFound
              ? "This receipt is unavailable or you do not have permission to view it."
              : error}
          </p>
          <Link href="/" className="btn-ghost mt-6 inline-flex">
            Back to Stellar Wave Hub
          </Link>
        </div>
      </div>
    );
  }

  const date = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(receipt.created_at));
  const product = receipt.product.replace(/[_-]+/g, " ");

  return (
    <div className="receipt-print min-h-[75vh] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="receipt-actions mb-5 flex items-center justify-between">
          <Link href="/" className="text-sm text-ash transition hover:text-starlight">
            Stellar Wave Hub
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-nova text-sm"
          >
            Print receipt
          </button>
        </div>

        <article className="receipt-paper overflow-hidden rounded-2xl border border-white/10 bg-[#fcfbf8] text-[#17212b] shadow-2xl shadow-black/30">
          <header className="border-b border-[#17212b]/10 px-7 py-8 sm:px-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5a6873]">
                  Stellar Wave Hub
                </p>
                <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Payment receipt
                </h1>
              </div>
              <span className="rounded-full border border-[#0b765d]/20 bg-[#0b765d]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0b765d]">
                Paid
              </span>
            </div>
            <p className="mt-3 text-sm text-[#5a6873]">
              A record of your payment on the Stellar network.
            </p>
          </header>

          <div className="px-7 py-8 sm:px-10">
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71808a]">
                  Amount paid
                </p>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                  {Number(receipt.amount_xlm).toLocaleString("en", {
                    maximumFractionDigits: 7,
                  })}{" "}
                  <span className="text-base font-medium">XLM</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71808a]">
                  Date
                </p>
                <p className="mt-2 text-base font-medium">{date} UTC</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71808a]">
                  Product
                </p>
                <p className="mt-2 text-base font-medium capitalize">{product}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71808a]">
                  Project
                </p>
                {receipt.project ? (
                  <Link
                    href={`/projects/${receipt.project.slug}`}
                    className="mt-2 inline-block text-base font-medium underline decoration-[#0b765d]/40 underline-offset-4 print:no-underline"
                  >
                    {receipt.project.name}
                  </Link>
                ) : (
                  <p className="mt-2 text-base font-medium">Not linked</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71808a]">
                  Payer
                </p>
                <p className="mt-2 break-all font-mono text-sm">
                  {receipt.payer_address}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-dashed border-[#17212b]/20 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71808a]">
                Transaction
              </p>
              <p className="mt-2 break-all font-mono text-xs leading-relaxed">
                {receipt.tx_hash}
              </p>
              <a
                href={receipt.stellar_expert_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-[#0b765d] underline underline-offset-4"
              >
                View on StellarExpert
              </a>
            </div>
          </div>

          <footer className="border-t border-[#17212b]/10 bg-[#f2f2ed] px-7 py-4 text-xs text-[#71808a] sm:px-10">
            Receipt ID: {receipt.tx_hash.slice(0, 12)}
          </footer>
        </article>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 16mm;
          }

          body {
            background: #fff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .receipt-print,
          .receipt-print * {
            visibility: visible !important;
          }

          .receipt-print {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            padding: 0 !important;
          }

          .receipt-paper {
            box-shadow: none !important;
          }

          .receipt-actions {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
