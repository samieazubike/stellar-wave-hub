"use client";

import { useAuth } from "@/context/AuthContext";
import { hasMinRole } from "@/lib/roles";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Purchase {
  project_id: number;
  project_name: string;
  project_slug: string;
  tx_hash: string;
  amount: number;
  stellar_network: string;
  explorer_url: string;
  status: "active" | "expired";
  promo_code: string | null;
  purchased_at: string;
  expires_at: string | null;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

interface RevenueData {
  summary: {
    total_revenue: number;
    total_purchases: number;
    active_spotlights: number;
    expired_spotlights: number;
  };
  revenue_over_time: MonthlyRevenue[];
  purchases: Purchase[];
}

function useRevenueSummary(token: string | null) {
  return useQuery<RevenueData>({
    queryKey: ["admin-revenue"],
    queryFn: async () => {
      const res = await fetch("/api/admin/revenue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        throw new Error("403 Forbidden");
      }
      if (!res.ok) throw new Error("Failed to fetch revenue data");
      return res.json();
    },
    enabled: !!token,
  });
}

export default function AdminRevenuePage() {
  const { user, token, loading: authLoading } = useAuth();
  const { data, isLoading, error } = useRevenueSummary(token);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="skeleton h-12 w-64 mb-8 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !hasMinRole(user.role, "admin") || error?.message === "403 Forbidden") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-supernova/10 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--supernova)"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="font-semibold text-xl text-starlight mb-2">403 Forbidden</h2>
          <p className="text-ash mb-6">
            You do not have administrative permissions to view the revenue dashboard.
          </p>
          <Link href="/" className="btn-nova inline-flex text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { summary, revenue_over_time = [], purchases = [] } = data || {
    summary: { total_revenue: 0, total_purchases: 0, active_spotlights: 0, expired_spotlights: 0 },
    revenue_over_time: [],
    purchases: [],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs font-medium text-ash hover:text-starlight transition-colors flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Admin Dashboard
            </Link>
          </div>
          <h1 className="font-display font-bold text-3xl text-starlight">
            Spotlight Revenue Dashboard
          </h1>
          <p className="text-ash text-sm mt-1">
            Summary of XLM revenue collected from featured project spotlights on-chain.
          </p>
        </div>

        <Link
          href="/admin"
          className="btn-ghost text-sm inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
          Manage Projects
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in animate-in-delay-1">
        <div className="glass rounded-2xl p-6 border-l-4 border-l-nova">
          <p className="text-xs uppercase tracking-wider font-semibold text-ash mb-1">Total Revenue</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl text-nova-bright">
              {summary.total_revenue.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-moonlight">XLM</span>
          </div>
          <p className="text-xs text-dust mt-2">On-chain spotlight payments</p>
        </div>

        <div className="glass rounded-2xl p-6 border-l-4 border-l-aurora">
          <p className="text-xs uppercase tracking-wider font-semibold text-ash mb-1">Active Spotlights</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl text-aurora-bright">
              {summary.active_spotlights}
            </span>
            <span className="text-sm font-medium text-ash">active</span>
          </div>
          <p className="text-xs text-dust mt-2">Currently featured projects</p>
        </div>

        <div className="glass rounded-2xl p-6 border-l-4 border-l-dust">
          <p className="text-xs uppercase tracking-wider font-semibold text-ash mb-1">Expired Spotlights</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl text-moonlight">
              {summary.expired_spotlights}
            </span>
            <span className="text-sm font-medium text-ash">expired</span>
          </div>
          <p className="text-xs text-dust mt-2">Past spotlight periods</p>
        </div>

        <div className="glass rounded-2xl p-6 border-l-4 border-l-solar">
          <p className="text-xs uppercase tracking-wider font-semibold text-ash mb-1">Total Purchases</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl text-solar-bright">
              {summary.total_purchases}
            </span>
            <span className="text-sm font-medium text-ash">transactions</span>
          </div>
          <p className="text-xs text-dust mt-2">Spotlight transactions count</p>
        </div>
      </div>

      {/* Revenue Over Time & Recent Purchases */}
      <div className="space-y-8 animate-in animate-in-delay-2">
        {/* Revenue over time breakdown */}
        {revenue_over_time.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-lg text-starlight mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Revenue Breakdown by Month
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {revenue_over_time.map((m) => (
                <div key={m.month} className="bg-stardust/30 border border-dust/20 rounded-xl p-4">
                  <span className="text-xs font-mono font-semibold text-ash block mb-1">{m.month}</span>
                  <div className="text-xl font-bold text-plasma-bright">{m.revenue} XLM</div>
                  <span className="text-xs text-dust mt-1 block">{m.count} purchase(s)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-lg text-starlight mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--nova-bright)" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Spotlight Transactions
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-dust/30 text-xs uppercase tracking-wider text-ash font-medium">
                    <th className="pb-3 px-3">Project</th>
                    <th className="pb-3 px-3">On-Chain Transaction</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Promo Code</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dust/20">
                  {purchases.map((p, i) => (
                    <tr key={i} className="hover:bg-stardust/20 transition-colors">
                      <td className="py-4 px-3">
                        <Link
                          href={`/projects/${p.project_slug}`}
                          target="_blank"
                          className="font-medium text-starlight hover:text-nova-bright transition-colors"
                        >
                          {p.project_name}
                        </Link>
                      </td>
                      <td className="py-4 px-3 font-mono text-xs">
                        <a
                          href={p.explorer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-plasma-bright hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>{p.tx_hash.slice(0, 12)}...</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </td>
                      <td className="py-4 px-3 font-semibold text-solar-bright">
                        {p.amount} XLM
                      </td>
                      <td className="py-4 px-3">
                        {p.promo_code ? (
                          <span className="tag tag-solar text-xs font-mono">{p.promo_code}</span>
                        ) : (
                          <span className="text-ash text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`tag text-xs ${
                            p.status === "active"
                              ? "tag-aurora"
                              : "bg-dust/40 text-ash border border-dust/30"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right text-xs text-ash">
                        {new Date(p.purchased_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-ash">No spotlight purchases recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
