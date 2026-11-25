"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { XlmPrice } from "@/components/XlmPrice";
import Link from "next/link";

interface PaymentItem {
  id: number;
  tx_hash: string;
  product: string;
  project_id: number;
  project_name: string;
  project_slug: string | null;
  amount: number;
  duration_days: number;
  source_address: string;
  destination_address: string;
  network: string;
  receipt_url: string;
  created_at: string;
}

function truncateHash(hash: string): string {
  if (!hash || hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function PaymentsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetch("/api/payments/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to load payment history");
          }
          return res.json();
        })
        .then((data) => {
          if (!cancelled) {
            setPayments(data.payments || []);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to load payments");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token]);

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="skeleton h-10 w-48 mb-3 rounded-lg" />
        <div className="skeleton h-5 w-80 mb-8 rounded" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-solar/10 border border-solar/20 flex items-center justify-center text-solar-bright">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h2 className="font-semibold text-xl text-starlight mb-2">Sign in required</h2>
          <p className="text-ash text-sm mb-6">
            Please sign in to view your payment history and Stellar blockchain receipts.
          </p>
          <Link href="/login" className="btn-nova text-sm inline-flex">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const totalVolume = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar/20 to-nova/20 border border-solar/20 flex items-center justify-center text-solar-bright">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-starlight">
                My Payments
              </h1>
              <p className="text-ash text-sm mt-0.5">
                On-chain receipts and payment history for your promoted projects
              </p>
            </div>
          </div>
          {payments.length > 0 && (
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 text-sm">
              <span className="text-ash">Total Spent:</span>
              <span className="font-bold text-nova-bright flex items-center">
                {totalVolume.toLocaleString()} XLM
                <XlmPrice amount={totalVolume} />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="glass rounded-2xl p-8 space-y-4">
          <div className="skeleton h-8 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
      ) : payments.length === 0 ? (
        /* Empty state */
        <div className="glass rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/40 border border-dust/20 flex items-center justify-center text-ash">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <path d="M16 14h.01" />
            </svg>
          </div>
          <h2 className="font-semibold text-lg text-starlight mb-2">No payments yet</h2>
          <p className="text-ash text-sm mb-6">
            When you purchase Featured Spotlights or other on-chain promotions, your transaction history and verified receipts will appear here.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/my-projects" className="btn-nova text-sm">
              View My Projects
            </Link>
            <Link href="/explore" className="btn-ghost text-sm">
              Explore Projects
            </Link>
          </div>
        </div>
      ) : (
        /* Table */
        <div className="glass rounded-2xl overflow-hidden border border-dust/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-dust/20 bg-void/30 text-ash text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Product</th>
                  <th className="py-3.5 px-4 font-semibold">Project</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Network</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dust/10">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-stardust/20 transition-colors">
                    <td className="py-4 px-4 font-medium text-starlight">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{p.product}</span>
                        {p.duration_days && (
                          <span className="text-xs bg-solar/15 text-solar-bright px-2 py-0.5 rounded-full border border-solar/20">
                            {p.duration_days}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-moonlight">
                      {p.project_slug ? (
                        <Link
                          href={`/projects/${p.project_slug}`}
                          className="hover:text-nova-bright hover:underline font-medium"
                        >
                          {p.project_name}
                        </Link>
                      ) : (
                        <span>{p.project_name}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-starlight flex items-center">
                        {p.amount} XLM
                        <XlmPrice amount={p.amount} />
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md uppercase font-medium ${
                          p.network === "mainnet"
                            ? "bg-aurora/10 text-aurora-bright border border-aurora/20"
                            : "bg-plasma/10 text-plasma-bright border border-plasma/20"
                        }`}
                      >
                        {p.network}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-ash whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <a
                        href={p.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-nova-bright hover:text-nova hover:underline text-xs font-mono"
                        title={p.tx_hash}
                      >
                        <span>{truncateHash(p.tx_hash)}</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
