import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { signToken } from "@/lib/auth";

const { supabaseState } = vi.hoisted(() => ({
  supabaseState: {
    payments: [] as Array<Record<string, unknown>>,
    projects: [] as Array<Record<string, unknown>>,
  },
}));

vi.mock("@/lib/firebase", () => ({
  default: {
    collection: () => ({
      where: () => ({
        get: async () => ({ empty: true, docs: [] }),
      }),
    }),
  },
  getSupabase: () => ({
    from: (table: string) => {
      if (table === "payments") {
        return {
          select: () => {
            let cutoffDateStr: string | null = null;
            const builder = {
              gte: (_field: string, val: string) => {
                cutoffDateStr = val;
                return builder;
              },
              order: () => {
                let filtered = [...supabaseState.payments];
                if (cutoffDateStr) {
                  const cutoff = new Date(cutoffDateStr).getTime();
                  filtered = filtered.filter(
                    (p) => new Date(p.created_at as string).getTime() >= cutoff,
                  );
                }
                return Promise.resolve({ data: filtered, error: null });
              },
            };
            return builder;
          },
        };
      }
      if (table === "projects") {
        return {
          select: () => ({
            in: (field: string, values: unknown[]) => {
              const filtered = supabaseState.projects.filter((p) =>
                values.includes(p[field]),
              );
              return Promise.resolve({ data: filtered, error: null });
            },
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null }),
      };
    },
  }),
}));

describe("GET /api/admin/revenue", () => {
  beforeEach(() => {
    supabaseState.payments = [];
    supabaseState.projects = [];
  });

  it("returns 403 Forbidden for non-admin users or unauthenticated requests", async () => {
    // Unauthenticated
    const unauthReq = new Request("http://localhost:3000/api/admin/revenue");
    const unauthRes = await GET(unauthReq);
    expect(unauthRes.status).toBe(403);

    // Regular user
    const userToken = signToken({ userId: 10, role: "user" });
    const userReq = new Request("http://localhost:3000/api/admin/revenue", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userRes = await GET(userReq);
    expect(userRes.status).toBe(403);

    // Maintainer (not admin)
    const maintainerToken = signToken({ userId: 11, role: "maintainer" });
    const maintainerReq = new Request("http://localhost:3000/api/admin/revenue", {
      headers: { Authorization: `Bearer ${maintainerToken}` },
    });
    const maintainerRes = await GET(maintainerReq);
    expect(maintainerRes.status).toBe(403);
  });

  it("calculates totals strictly matching the ledger (acceptance criteria)", async () => {
    const adminToken = signToken({ userId: 1, role: "admin" });
    const now = new Date();

    supabaseState.payments = [
      {
        id: 1,
        tx_hash: "tx_hash_1",
        product: "spotlight",
        user_id: 101,
        project_id: 1,
        amount: 50,
        duration_days: 30,
        source_address: "GBALICE",
        destination_address: "GBDEST",
        network: "mainnet",
        created_at: new Date(now.getTime() - 2 * 86400 * 1000).toISOString(),
      },
      {
        id: 2,
        tx_hash: "tx_hash_2",
        product: "spotlight",
        user_id: 102,
        project_id: 2,
        amount: 15,
        duration_days: 7,
        source_address: "GBBOB",
        destination_address: "GBDEST",
        network: "mainnet",
        created_at: new Date(now.getTime() - 5 * 86400 * 1000).toISOString(),
      },
      {
        id: 3,
        tx_hash: "tx_hash_3",
        product: "spotlight",
        user_id: 101,
        project_id: 1,
        amount: 120,
        duration_days: 90,
        source_address: "GBALICE",
        destination_address: "GBDEST",
        network: "mainnet",
        created_at: new Date(now.getTime() - 10 * 86400 * 1000).toISOString(),
      },
    ];

    supabaseState.projects = [
      { numericId: 1, name: "Stellar Lumen Wave", slug: "stellar-lumen-wave" },
      { numericId: 2, name: "Soroban Swap", slug: "soroban-swap" },
    ];

    const req = new Request("http://localhost:3000/api/admin/revenue?range=30d", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Summary totals must match payments ledger
    expect(body.summary.total_revenue).toBe(185); // 50 + 15 + 120
    expect(body.summary.total_transactions).toBe(3);
    expect(body.summary.average_payment).toBeCloseTo(61.6667, 2);

    // Product breakdown
    expect(body.by_product).toEqual([
      { product: "spotlight", revenue: 185, count: 3 },
    ]);

    // Top payers
    expect(body.top_payers.length).toBe(2);
    expect(body.top_payers[0].user_id).toBe(101);
    expect(body.top_payers[0].total_amount).toBe(170); // 50 + 120
    expect(body.top_payers[0].count).toBe(2);

    expect(body.top_payers[1].user_id).toBe(102);
    expect(body.top_payers[1].total_amount).toBe(15);
    expect(body.top_payers[1].count).toBe(1);

    // Time series
    expect(body.time_series.length).toBeGreaterThanOrEqual(1);

    // Purchases enriched with project metadata
    expect(body.purchases.length).toBe(3);
    expect(body.purchases[0].project_name).toBe("Stellar Lumen Wave");
    expect(body.purchases[0].explorer_url).toContain("stellar.expert/explorer/public/tx/");
  });

  it("filters ledger by date range (e.g. 7d)", async () => {
    const adminToken = signToken({ userId: 1, role: "admin" });
    const now = new Date();

    supabaseState.payments = [
      {
        id: 1,
        tx_hash: "recent_tx",
        product: "spotlight",
        user_id: 101,
        project_id: 1,
        amount: 50,
        duration_days: 30,
        source_address: "GBALICE",
        destination_address: "GBDEST",
        network: "mainnet",
        created_at: new Date(now.getTime() - 2 * 86400 * 1000).toISOString(), // 2 days ago (within 7d)
      },
      {
        id: 2,
        tx_hash: "old_tx",
        product: "spotlight",
        user_id: 102,
        project_id: 2,
        amount: 100,
        duration_days: 30,
        source_address: "GBBOB",
        destination_address: "GBDEST",
        network: "mainnet",
        created_at: new Date(now.getTime() - 20 * 86400 * 1000).toISOString(), // 20 days ago (outside 7d)
      },
    ];

    const req = new Request("http://localhost:3000/api/admin/revenue?range=7d", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.summary.total_revenue).toBe(50);
    expect(body.summary.total_transactions).toBe(1);
    expect(body.purchases.length).toBe(1);
    expect(body.purchases[0].tx_hash).toBe("recent_tx");
  });
});
