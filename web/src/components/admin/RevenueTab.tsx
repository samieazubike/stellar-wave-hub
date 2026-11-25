"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { XlmPrice } from "@/components/XlmPrice";
import Link from "next/link";

interface RevenueSummary {
  total_revenue: number;
  total_transactions: number;
  total_purchases: number;
  average_payment: number;
  active_spotlights: number;
  expired_spotlights: number;
  range: string;
}

interface ProductRevenue {
  product: string;
  revenue: number;
  count: number;
}

interface TimeSeriesPoint {
  date: string;
  label: string;
  revenue: number;
  count: number;
}

interface TopPayer {
  user_id: number;
  address: string;
  total_amount: number;
  count: number;
}

interface LedgerPurchase {
  id: number;
  project_id: number;
  project_name: string;
  project_slug: string | null;
  tx_hash: string;
  product: string;
  amount: number;
  duration_days: number;
  user_id: number;
  source_address: string;
  stellar_network: string;
  explorer_url: string;
  status: "active" | "expired";
  purchased_at: string;
  expires_at: string;
}

interface RevenueResponse {
  summary: RevenueSummary;
  by_product: ProductRevenue[];
  top_payers: TopPayer[];
  time_series: TimeSeriesPoint[];
  revenue_over_time: { month: string; revenue: number; count: number }[];
  purchases: LedgerPurchase[];
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RevenueTab({ token }: { token: string | null }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const { data, isLoading, error } = useQuery<RevenueResponse>({
    queryKey: ["admin-revenue", range],
    queryFn: async () => {
      const res = await fetch(`/api/admin/revenue?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to load revenue data");
      }
      return res.json();
    },
    enabled: !!token,
  });

  const summary = data?.summary || {
    total_revenue: 0,
    total_transactions: 0,
    total_purchases: 0,
    average_payment: 0,
    active_spotlights: 0,
    expired_spotlights: 0,
    range,
  };

  const timeSeries = data?.time_series || [];
  const byProduct = data?.by_product || [];
  const topPayers = data?.top_payers || [];
  const purchases = data?.purchases || [];

  // SVG Chart Dimensions & Computations
  const chartWidth = 680;
  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const maxRevenue = Math.max(
    ...timeSeries.map((p) => p.revenue),
    10, // at least 10 for clean grid
  );

  return (
    <div className="space-y-8 animate-in">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-starlight">Revenue Dashboard</h2>
          <p className="text-sm text-ash mt-0.5">
            Verified on-chain payments ledger, metrics, and trend analytics
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-void/50 border border-dust/20 rounded-xl self-start sm:self-auto">
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === r
                  ? "bg-nova text-white shadow-sm"
                  : "text-ash hover:text-starlight hover:bg-stardust/40"
              }`}
            >
              {r === "7d"
                ? "7 Days"
                : r === "30d"
                  ? "30 Days"
                  : r === "90d"
                    ? "90 Days"
                    : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm">
          {error.message}
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass rounded-2xl p-5 border border-dust/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-ash text-xs uppercase tracking-wider mb-2">
            <span>Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center text-nova-bright">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-starlight flex items-baseline flex-wrap gap-1">
            <span>{summary.total_revenue.toLocaleString()}</span>
            <span className="text-sm font-semibold text-nova-bright">XLM</span>
            <XlmPrice amount={summary.total_revenue} className="text-xs text-ash" />
          </div>
          <p className="text-xs text-ash mt-1">Ledger verified payments</p>
        </div>

        {/* Transactions */}
        <div className="glass rounded-2xl p-5 border border-dust/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-ash text-xs uppercase tracking-wider mb-2">
            <span>Transactions</span>
            <div className="w-7 h-7 rounded-lg bg-solar/10 border border-solar/20 flex items-center justify-center text-solar-bright">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-starlight">
            {summary.total_transactions}
          </div>
          <p className="text-xs text-ash mt-1">Total completed payments</p>
        </div>

        {/* Average Payment */}
        <div className="glass rounded-2xl p-5 border border-dust/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-ash text-xs uppercase tracking-wider mb-2">
            <span>Avg Payment</span>
            <div className="w-7 h-7 rounded-lg bg-aurora/10 border border-aurora/20 flex items-center justify-center text-aurora-bright">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-starlight flex items-baseline flex-wrap gap-1">
            <span>{summary.average_payment.toLocaleString()}</span>
            <span className="text-sm font-semibold text-aurora-bright">XLM</span>
            <XlmPrice amount={summary.average_payment} className="text-xs text-ash" />
          </div>
          <p className="text-xs text-ash mt-1">Per transaction average</p>
        </div>

        {/* Active Spotlights */}
        <div className="glass rounded-2xl p-5 border border-dust/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-ash text-xs uppercase tracking-wider mb-2">
            <span>Active Spotlights</span>
            <div className="w-7 h-7 rounded-lg bg-plasma/10 border border-plasma/20 flex items-center justify-center text-plasma-bright">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-starlight">
            {summary.active_spotlights}
          </div>
          <p className="text-xs text-ash mt-1">
            {summary.expired_spotlights} past / expired
          </p>
        </div>
      </div>

      {/* Inline SVG Bar Chart: Revenue Trend */}
      <div className="glass rounded-2xl p-6 border border-dust/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-starlight">Revenue Over Time</h3>
            <p className="text-xs text-ash mt-0.5">
              Daily revenue trend in XLM for selected range ({range})
            </p>
          </div>
          {timeSeries.length > 0 && (
            <span className="text-xs text-ash font-mono">
              Max: {maxRevenue.toLocaleString()} XLM
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="h-56 skeleton rounded-xl" />
        ) : timeSeries.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-ash text-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 text-dust">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>No payment activity recorded during this period</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[500px]"
              aria-label="Revenue over time chart"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--nova-bright, #818cf8)" />
                  <stop offset="100%" stopColor="var(--nova, #6366f1)" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--solar-bright, #fbbf24)" />
                  <stop offset="100%" stopColor="var(--solar, #f59e0b)" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = paddingTop + plotHeight * (1 - pct);
                const val = Math.round(maxRevenue * pct);
                return (
                  <g key={pct}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.07)"
                      strokeDasharray={pct === 0 ? undefined : "3 3"}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 4}
                      fill="var(--ash, #94a3b8)"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {timeSeries.map((point, index) => {
                const barWidth = Math.max(
                  6,
                  Math.min(32, (plotWidth / timeSeries.length) * 0.7),
                );
                const step = plotWidth / timeSeries.length;
                const x = paddingLeft + index * step + (step - barWidth) / 2;
                const barHeight = Math.max(
                  4,
                  (point.revenue / maxRevenue) * plotHeight,
                );
                const y = paddingTop + plotHeight - barHeight;

                return (
                  <g key={point.date} className="cursor-pointer group">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      ry="3"
                      fill="url(#barGradient)"
                      className="transition-all hover:opacity-90 hover:fill-[url(#barHoverGradient)]"
                    >
                      <title>{`${point.label} (${point.date}): ${point.revenue} XLM (${point.count} payments)`}</title>
                    </rect>

                    {/* X-axis date labels: show on every item or spaced */}
                    {(timeSeries.length <= 10 ||
                      index % Math.ceil(timeSeries.length / 8) === 0 ||
                      index === timeSeries.length - 1) && (
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - 12}
                        fill="var(--ash, #94a3b8)"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {point.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Bottom Baseline */}
              <line
                x1={paddingLeft}
                y1={paddingTop + plotHeight}
                x2={chartWidth - paddingRight}
                y2={paddingTop + plotHeight}
                stroke="rgba(255, 255, 255, 0.15)"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Grid: By Product & Top Payers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Product */}
        <div className="glass rounded-2xl p-6 border border-dust/20">
          <h3 className="font-semibold text-starlight mb-1">Revenue by Product</h3>
          <p className="text-xs text-ash mb-4">Volume breakdown across platform features</p>

          {byProduct.length === 0 ? (
            <p className="text-ash text-sm py-4">No product sales yet</p>
          ) : (
            <div className="space-y-3">
              {byProduct.map((prod) => (
                <div
                  key={prod.product}
                  className="flex items-center justify-between p-3 rounded-xl bg-stardust/20 border border-dust/10"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-nova" />
                    <div>
                      <p className="font-medium text-starlight capitalize text-sm">
                        {prod.product}
                      </p>
                      <p className="text-xs text-ash">{prod.count} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-nova-bright text-sm">
                      {prod.revenue.toLocaleString()} XLM
                    </p>
                    <XlmPrice amount={prod.revenue} className="text-xs text-ash" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Payers */}
        <div className="glass rounded-2xl p-6 border border-dust/20">
          <h3 className="font-semibold text-starlight mb-1">Top Payers</h3>
          <p className="text-xs text-ash mb-4">Users contributing the highest volume</p>

          {topPayers.length === 0 ? (
            <p className="text-ash text-sm py-4">No payment activity</p>
          ) : (
            <div className="space-y-3">
              {topPayers.slice(0, 5).map((payer, idx) => (
                <div
                  key={payer.address + idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-stardust/20 border border-dust/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-ash w-4 text-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-mono text-xs text-moonlight">
                        {truncateAddress(payer.address)}
                      </p>
                      <p className="text-xs text-ash">{payer.count} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-solar-bright text-sm">
                      {payer.total_amount.toLocaleString()} XLM
                    </p>
                    <XlmPrice amount={payer.total_amount} className="text-xs text-ash" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="glass rounded-2xl p-6 border border-dust/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-starlight">Payments Ledger</h3>
            <p className="text-xs text-ash mt-0.5">
              Individual transactions recorded in the payments ledger
            </p>
          </div>
          <span className="text-xs text-ash bg-stardust/40 px-2.5 py-1 rounded-lg">
            {purchases.length} Records
          </span>
        </div>

        {purchases.length === 0 ? (
          <p className="text-ash text-sm py-6 text-center">No transactions in this time range</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-dust/20 bg-void/30 text-ash text-xs uppercase tracking-wider">
                  <th className="py-3 px-3 font-semibold">Product</th>
                  <th className="py-3 px-3 font-semibold">Project</th>
                  <th className="py-3 px-3 font-semibold">Amount</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dust/10">
                {purchases.slice(0, 15).map((p) => (
                  <tr key={p.id} className="hover:bg-stardust/20 transition-colors">
                    <td className="py-3 px-3 font-medium text-starlight capitalize">
                      {p.product}
                    </td>
                    <td className="py-3 px-3 text-moonlight">
                      {p.project_slug ? (
                        <Link
                          href={`/projects/${p.project_slug}`}
                          className="hover:text-nova-bright hover:underline font-medium"
                        >
                          {p.project_name}
                        </Link>
                      ) : (
                        p.project_name
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-starlight flex items-center">
                        {p.amount} XLM
                        <XlmPrice amount={p.amount} />
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === "active"
                            ? "bg-aurora/15 text-aurora-bright border border-aurora/20"
                            : "bg-dust/20 text-ash border border-dust/30"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-ash whitespace-nowrap text-xs">
                      {formatDate(p.purchased_at)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <a
                        href={p.explorer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-nova-bright hover:underline text-xs font-mono"
                      >
                        <span>{truncateAddress(p.tx_hash)}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        )}
      </div>
    </div>
  );
}

export default RevenueTab;
