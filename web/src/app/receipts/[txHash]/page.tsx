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
  const [message, setMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();
    setLoading(true);
    setMessage("");
    setNotFound(false);

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
        if (!controller.signal.aborted) {
          setMessage(err instanceof Error ? err.message : "Could not load receipt");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [authLoading, token, txHash]);

  if (loading || authLoading) {
    return <p className="py-16 text-center text-ash">Loading receipt...</p>;
  }

  if (notFound || message || !receipt) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
        <div className="glass rounded-2xl p-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-starlight">
            {notFound ? "Receipt not found" : "Receipt unavailable"}
          </h1>
          <p className="mt-3 text-sm text-ash">
            {notFound
              ? "This receipt is unavailable or you do not have permission to view it."
              : message}
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
  const product = (receipt.product || "Payment").replace(/[_-]+/g, " ");

  return (
    <main className="receipt-print min-h-[75vh] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="receipt-actions mb-5 flex justify-between">
          <Link href="/" className="text-sm text-ash hover:text-starlight">
            Stellar Wave Hub
          </Link>
          <button onClick={() => window.print()} className="btn-nova text-sm">
            Print receipt
          </button>
        </div>

        <article className="receipt-paper overflow-hidden rounded-2xl bg-[#fcfbf8] text-[#17212b] shadow-2xl">
          <header className="border-b border-black/10 px-7 py-8 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5a6873]">
              Stellar Wave Hub
            </p>
            <div className="mt-5 flex items-center justify-between">
              <h1 className="font-display text-3xl font-semibold">Payment receipt</h1>
              <span className="rounded-full bg-[#0b765d]/10 px-3 py-1 text-xs font-semibold uppercase text-[#0b765d]">
                Paid
              </span>
            </div>
          </header>

          <dl className="grid gap-7 px-7 py-8 sm:grid-cols-2 sm:px-10">
            <div>
              <dt className="receipt-label">Amount paid</dt>
              <dd className="mt-2 font-display text-3xl font-semibold">
                {Number(receipt.amount_xlm).toLocaleString("en", {
                  maximumFractionDigits: 7,
                })}{" "}
                XLM
              </dd>
            </div>
            <div>
              <dt className="receipt-label">Date</dt>
              <dd className="mt-2">{date} UTC</dd>
            </div>
            <div>
              <dt className="receipt-label">Product</dt>
              <dd className="mt-2 capitalize">{product}</dd>
            </div>
            <div>
              <dt className="receipt-label">Project</dt>
              <dd className="mt-2">
                {receipt.project ? (
                  <Link
                    href={`/projects/${receipt.project.slug}`}
                    className="underline underline-offset-4 print:no-underline"
                  >
                    {receipt.project.name}
                  </Link>
                ) : (
                  "Not linked"
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="receipt-label">Payer</dt>
              <dd className="mt-2 break-all font-mono text-sm">
                {receipt.payer_address}
              </dd>
            </div>
            <div className="border-t border-dashed border-black/20 pt-5 sm:col-span-2">
              <dt className="receipt-label">Transaction</dt>
              <dd className="mt-2 break-all font-mono text-xs leading-relaxed">
                {receipt.tx_hash}
              </dd>
              <a
                href={receipt.stellar_expert_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-[#0b765d] underline"
              >
                View on StellarExpert
              </a>
            </div>
          </dl>
          <footer className="border-t border-black/10 bg-[#f2f2ed] px-7 py-4 text-xs text-[#71808a] sm:px-10">
            Receipt ID: {receipt.tx_hash.slice(0, 12)}
          </footer>
        </article>
      </div>

      <style>{`
        .receipt-label {
          color: #71808a;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        @media print {
          @page { margin: 16mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .receipt-print, .receipt-print * { visibility: visible !important; }
          .receipt-print {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            padding: 0 !important;
          }
          .receipt-paper { box-shadow: none !important; }
          .receipt-actions { display: none !important; }
        }
      `}</style>
    </main>
  );
}
