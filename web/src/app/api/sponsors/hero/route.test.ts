/**
 * Tests for the homepage hero sponsorship booking API (#460).
 *
 * Acceptance criteria:
 *   ✓ A week can be booked once (second booking gets 409)
 *   ✓ Current week's sponsor is returned by GET
 *   ✓ Availability covers the current week plus the next 8 weeks
 *   ✓ Payment is verified on Horizon (memo hero:<weekStart>, amount, destination)
 *   ✓ Anonymous bookings are rejected
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { horizonState, supabaseState } = vi.hoisted(() => ({
  horizonState: {
    transactions: null as null | { successful: boolean; memo_type: string; memo: string },
    transactionError: false,
    operations: [] as Array<{ type: string; to?: string; asset_type?: string; amount?: string }>,
  },
  supabaseState: {
    heroRows: [] as Array<Record<string, unknown>>,
    projectExists: true,
    insertError: null as null | { code: string },
    inserted: null as Record<string, unknown> | null,
  },
}));

vi.mock("@stellar/stellar-sdk", () => ({
  Horizon: {
    Server: class {
      transactions() {
        return {
          transaction: () => ({
            call: async () => {
              if (horizonState.transactionError) throw new Error("not found");
              return horizonState.transactions!;
            },
          }),
        };
      }
      operations() {
        return {
          forTransaction: () => ({
            limit: () => ({
              call: async () => ({ records: horizonState.operations }),
            }),
          }),
        };
      }
    },
  },
}));

vi.mock("@/lib/auth", () => ({ getAuthUser: vi.fn() }));

vi.mock("@/lib/db", () => ({
  heroSponsorsCol: {
    ref: {
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: async () => ({
            empty: supabaseState.heroRows.length === 0,
            docs: supabaseState.heroRows,
          }),
        })),
      })),
    },
  },
}));

/** Minimal thenable Supabase query builder covering the chains the route uses. */
vi.mock("@/lib/firebase", () => ({
  getSupabase: vi.fn(() => ({
    from: (table: string) => {
      const state = { table, filters: [] as Array<[string, unknown]> };
      const builder: Record<string, unknown> = {};
      const self = () => builder;
      builder.select = () => self();
      builder.eq = (field: string, value: unknown) => {
        state.filters.push([field, value]);
        return self();
      };
      builder.gte = () => self();
      builder.lte = () => self();
      builder.order = () => self();
      builder.limit = () => self();
      builder.maybeSingle = async () => ({
        data: table === "projects" && supabaseState.projectExists ? { numericId: 1 } : null,
        error: null,
      });
      builder.single = async () => ({ data: supabaseState.inserted, error: supabaseState.insertError });
      builder.insert = (row: Record<string, unknown>) => {
        if (supabaseState.insertError) return self();
        supabaseState.inserted = row;
        return self();
      };
      // Awaiting the builder runs the query.
      builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve({
          data: table === "hero_sponsors" ? supabaseState.heroRows : [],
          error: null,
        }).then(resolve, reject);
      return builder;
    },
  })),
}));

import { getAuthUser } from "@/lib/auth";
import { GET, POST } from "./route";

const TX_HASH = "a".repeat(64);

function mondayOf(date: Date): string {
  const day = date.getUTCDay();
  const sinceMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - sinceMonday),
  );
  return monday.toISOString().slice(0, 10);
}

function addDays(weekStart: string, days: number): string {
  const date = new Date(`${weekStart}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function bookRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/sponsors/hero", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedPayment(overrides: { memo?: string; amount?: string; successful?: boolean } = {}) {
  horizonState.transactionError = false;
  horizonState.transactions = {
    successful: overrides.successful ?? true,
    memo_type: "text",
    memo: overrides.memo ?? "",
  };
  horizonState.operations = [
    {
      type: "payment",
      to: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      asset_type: "native",
      amount: overrides.amount ?? "150",
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.HERO_SPONSOR_WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  process.env.NEXT_PUBLIC_PRICE_HERO_SPONSOR_XLM = "150";
  horizonState.transactionError = false;
  horizonState.transactions = null;
  horizonState.operations = [];
  supabaseState.heroRows = [];
  supabaseState.projectExists = true;
  supabaseState.insertError = null;
  supabaseState.inserted = null;
  vi.mocked(getAuthUser).mockReturnValue({ userId: 10, role: "contributor" });
});

describe("GET /api/sponsors/hero", () => {
  it("returns the current week's sponsor and 9 weeks of availability", async () => {
    const currentWeek = mondayOf(new Date());
    supabaseState.heroRows = [
      { week_start: currentWeek, project_id: 1, headline: "Sponsored", tx_hash: TX_HASH },
    ];

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.current).not.toBeNull();
    expect(body.current.week_start).toBe(currentWeek);
    expect(body.price_xlm).toBe(150);
    expect(body.weeks).toHaveLength(9);
    expect(body.weeks[0]).toEqual({ week_start: currentWeek, available: false });
    expect(body.weeks[1]).toEqual({ week_start: addDays(currentWeek, 7), available: true });
  });

  it("returns current: null and all weeks available when nothing is booked", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.current).toBeNull();
    expect(body.weeks.every((w: { available: boolean }) => w.available)).toBe(true);
  });
});

describe("POST /api/sponsors/hero", () => {
  it("rejects anonymous bookings", async () => {
    vi.mocked(getAuthUser).mockReturnValue(null);

    const res = await POST(
      bookRequest({ weekStart: mondayOf(new Date()), projectId: 1, txHash: TX_HASH }),
    );

    expect(res.status).toBe(401);
  });

  it("books a week once the Horizon payment is verified", async () => {
    const currentWeek = mondayOf(new Date());
    seedPayment({ memo: `hero:${currentWeek}` });

    const res = await POST(
      bookRequest({ weekStart: currentWeek, projectId: 1, headline: "Launch week", txHash: TX_HASH }),
    );

    expect(res.status).toBe(201);
    expect(supabaseState.inserted).toMatchObject({
      week_start: currentWeek,
      project_id: 1,
      headline: "Launch week",
      tx_hash: TX_HASH,
    });
  });

  it("returns 409 when the week is already booked", async () => {
    const currentWeek = mondayOf(new Date());
    supabaseState.heroRows = [{ week_start: currentWeek }];
    seedPayment({ memo: `hero:${currentWeek}` });

    const res = await POST(
      bookRequest({ weekStart: currentWeek, projectId: 1, txHash: TX_HASH }),
    );

    expect(res.status).toBe(409);
    expect(supabaseState.inserted).toBeNull();
  });

  it("returns 409 when the payment was already redeemed", async () => {
    const currentWeek = mondayOf(new Date());
    seedPayment({ memo: `hero:${currentWeek}` });
    supabaseState.insertError = { code: "23505" };

    const res = await POST(
      bookRequest({ weekStart: currentWeek, projectId: 1, txHash: TX_HASH }),
    );

    expect(res.status).toBe(409);
  });

  it("rejects a payment with the wrong memo", async () => {
    const currentWeek = mondayOf(new Date());
    seedPayment({ memo: "something-else" });

    const res = await POST(
      bookRequest({ weekStart: currentWeek, projectId: 1, txHash: TX_HASH }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(`hero:${currentWeek}`);
    expect(supabaseState.inserted).toBeNull();
  });

  it("rejects a payment below the required amount", async () => {
    const currentWeek = mondayOf(new Date());
    seedPayment({ memo: `hero:${currentWeek}`, amount: "10" });

    const res = await POST(
      bookRequest({ weekStart: currentWeek, projectId: 1, txHash: TX_HASH }),
    );

    expect(res.status).toBe(400);
    expect(supabaseState.inserted).toBeNull();
  });

  it("rejects weeks outside the bookable window", async () => {
    const currentWeek = mondayOf(new Date());
    seedPayment({ memo: `hero:${currentWeek}` });

    const res = await POST(
      bookRequest({ weekStart: addDays(currentWeek, 7 * 9), projectId: 1, txHash: TX_HASH }),
    );

    expect(res.status).toBe(400);
    expect(supabaseState.inserted).toBeNull();
  });

  it("returns 404 when the project does not exist", async () => {
    const currentWeek = mondayOf(new Date());
    supabaseState.projectExists = false;
    seedPayment({ memo: `hero:${currentWeek}` });

    const res = await POST(
      bookRequest({ weekStart: currentWeek, projectId: 999, txHash: TX_HASH }),
    );

    expect(res.status).toBe(404);
    expect(supabaseState.inserted).toBeNull();
  });
});
