import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DONATION_PRODUCT,
  SUPPORTER_MIN_XLM,
  getDonationTotals,
  getSupporterStatus,
  getSupporterStatuses,
  getSupporterThreshold,
} from "./supporters";

const { state } = vi.hoisted(() => ({
  state: {
    payments: [] as Array<Record<string, unknown>>,
    queryError: null as string | null,
    queries: [] as Array<{ table: string; product: string; userIds: number[] }>,
  },
}));

vi.mock("@/lib/firebase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (field: string, product: unknown) => ({
          in: (userField: string, userIds: number[]) => {
            state.queries.push({
              table,
              product: String(product),
              userIds,
            });
            if (state.queryError) {
              return Promise.resolve({ data: null, error: { message: state.queryError } });
            }
            const rows = state.payments.filter(
              (row) => row[field] === product && userIds.includes(Number(row[userField])),
            );
            return Promise.resolve({ data: rows, error: null });
          },
        }),
      }),
    }),
  }),
}));

const previous = process.env.SUPPORTER_MIN_XLM;

function tip(userId: number, amount: number, product = DONATION_PRODUCT) {
  return { user_id: userId, amount, product };
}

beforeEach(() => {
  state.payments = [];
  state.queryError = null;
  state.queries = [];
  delete process.env.SUPPORTER_MIN_XLM;
});

afterEach(() => {
  if (previous === undefined) delete process.env.SUPPORTER_MIN_XLM;
  else process.env.SUPPORTER_MIN_XLM = previous;
});

describe("supporter threshold", () => {
  it("defaults to 10 XLM and accepts a positive override", () => {
    expect(SUPPORTER_MIN_XLM).toBe(10);
    expect(getSupporterThreshold()).toBe(10);

    process.env.SUPPORTER_MIN_XLM = "25";
    expect(getSupporterThreshold()).toBe(25);
  });

  it("rejects an invalid override instead of substituting a default", () => {
    process.env.SUPPORTER_MIN_XLM = "not-a-number";
    expect(() => getSupporterThreshold()).toThrow("positive finite number");

    process.env.SUPPORTER_MIN_XLM = "0";
    expect(() => getSupporterThreshold()).toThrow("positive finite number");
  });
});

describe("donation totals", () => {
  it("sums every tip for a user and ignores purchases", async () => {
    state.payments = [
      tip(7, 4),
      tip(7, 6),
      tip(7, 500, "spotlight"),
      tip(8, 3),
    ];

    const totals = await getDonationTotals([7]);
    expect(totals.get(7)).toBe(10);
    expect(totals.has(8)).toBe(false);
    expect(state.queries).toEqual([
      { table: "payments", product: "tip", userIds: [7] },
    ]);
  });

  it("ignores malformed rows and deduplicates requested ids", async () => {
    state.payments = [
      tip(7, 5),
      { user_id: 7, amount: 0, product: "tip" },
      { user_id: 7, amount: "bad", product: "tip" },
      { user_id: "not-a-number", amount: 9, product: "tip" },
    ];

    expect((await getDonationTotals([7, 7, 8])).get(7)).toBe(5);
    expect(state.queries[0].userIds).toEqual([7, 8]);
  });

  it("does not query the database for an empty id set", async () => {
    expect((await getDonationTotals([null, undefined, 0, -1])).size).toBe(0);
    expect(state.queries).toEqual([]);
  });

  it("surfaces a database error with context", async () => {
    state.queryError = "payments table unavailable";
    await expect(getDonationTotals([7])).rejects.toThrow(
      /Failed to load donation totals: payments table unavailable/,
    );
  });
});

describe("supporter status", () => {
  it("appears only when the total reaches the threshold", async () => {
    state.payments = [tip(7, 9.5), tip(8, 10), tip(9, 12)];

    expect((await getSupporterStatus(7)).is_supporter).toBe(false);
    expect((await getSupporterStatus(8)).is_supporter).toBe(true);
    expect((await getSupporterStatus(9)).is_supporter).toBe(true);

    const statuses = await getSupporterStatuses([7, 8, 999]);
    expect(statuses.get(8)).toEqual({
      is_supporter: true,
      total_xlm: 10,
      threshold: 10,
    });
    expect(statuses.get(999)).toEqual({
      is_supporter: false,
      total_xlm: 0,
      threshold: 10,
    });
  });

  it("uses the configured threshold for eligibility", async () => {
    process.env.SUPPORTER_MIN_XLM = "25";
    state.payments = [tip(7, 24), tip(8, 25)];

    expect((await getSupporterStatus(7)).is_supporter).toBe(false);
    expect((await getSupporterStatus(8)).is_supporter).toBe(true);
  });

  it("returns a non-supporter for a missing id without querying", async () => {
    expect(await getSupporterStatus(null)).toEqual({
      is_supporter: false,
      total_xlm: 0,
      threshold: 10,
    });
    expect(state.queries).toEqual([]);
  });
});
