"use client";

import { useQueries } from "@tanstack/react-query";

type Financials =
  | { status: "no-account" }
  | { status: "error" }
  | { status: "ok"; xlmBalance: number | null; transactions: number; contractOps: number };

async function getJson(url: string): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const res = await fetch(url);
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

async function loadFinancials(projectId: number): Promise<Financials> {
  const [summary, transactions, contractOps] = await Promise.all([
    getJson(`/api/financials/${projectId}/summary`),
    getJson(`/api/financials/${projectId}/transactions`),
    getJson(`/api/financials/${projectId}/contract-ops`),
  ]);
  // The financials APIs return 400 when the project has no Stellar account linked.
  if (summary.status === 400) return { status: "no-account" };
  if (!summary.ok) return { status: "error" };

  const balances = ((summary.body.summary as { balances?: { asset_type: string; balance: string }[] })?.balances) ?? [];
  const native = balances.find((b) => b.asset_type === "native");
  return {
    status: "ok",
    xlmBalance: native ? Number(native.balance) : null,
    transactions: Array.isArray(transactions.body.transactions) ? transactions.body.transactions.length : 0,
    contractOps: Array.isArray(contractOps.body.operations) ? contractOps.body.operations.length : 0,
  };
}

const ROWS: { label: string; render: (f: Extract<Financials, { status: "ok" }>) => string }[] = [
  {
    label: "XLM balance",
    render: (f) => (f.xlmBalance === null ? "—" : f.xlmBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })),
  },
  { label: "Recent transactions", render: (f) => String(f.transactions) },
  { label: "Contract ops", render: (f) => String(f.contractOps) },
];

function Cell({ financials, row }: { financials: Financials | undefined; row: (typeof ROWS)[number] }) {
  if (!financials) return <span className="skeleton inline-block h-5 w-16 rounded" aria-label="Loading" />;
  if (financials.status === "no-account") return <span className="text-xs text-ash">No Stellar account</span>;
  if (financials.status === "error") return <span className="text-xs text-ash">Unavailable</span>;
  return <span className="text-sm font-semibold tabular-nums text-starlight">{row.render(financials)}</span>;
}

/** On-chain financial rows for /compare (#437), loaded per project from the financials APIs. */
export default function CompareFinancials({
  projectIds,
  layout,
  projectIndex,
}: {
  projectIds: number[];
  layout: "table" | "card";
  projectIndex?: number;
}) {
  const results = useQueries({
    queries: projectIds.map((id) => ({
      queryKey: ["compare-financials", id],
      queryFn: () => loadFinancials(id),
      staleTime: 60_000,
    })),
  });

  if (layout === "card" && projectIndex !== undefined) {
    return (
      <>
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-sm text-moonlight">{row.label}</dt>
            <dd>
              <Cell financials={results[projectIndex]?.data} row={row} />
            </dd>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {ROWS.map((row) => (
        <tr key={row.label} className="border-t border-dust/25">
          <th scope="row" className="px-5 py-5 text-sm font-medium text-moonlight">{row.label}</th>
          {projectIds.map((id, index) => (
            <td key={id} className="px-5 py-5">
              <Cell financials={results[index]?.data} row={row} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
