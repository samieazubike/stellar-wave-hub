import { beforeEach, describe, expect, it, vi } from "vitest";

type Promo = {
  id: number;
  code: string;
  percent_off: number;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  active?: boolean;
};

const { state } = vi.hoisted(() => ({
  state: {
    promo: null as Promo | null,
    project: null as Record<string, unknown> | null,
    projectUpdate: null as Record<string, unknown> | null,
    projectUpdateError: null as { message: string } | null,
    consumeFails: false,
    paymentDeleted: false,
  },
}));

function filtersMatch(
  filters: Array<{ field: string; value: unknown }>,
  row: Record<string, unknown>,
): boolean {
  return filters.every(({ field, value }) => row[field] === value);
}

function execute(
  table: string,
  operation: "select" | "update" | "delete",
  filters: Array<{ field: string; value: unknown }>,
  values: Record<string, unknown> | null,
) {
  if (operation === "select") {
    if (table === "promo_codes") return { data: state.promo ? { ...state.promo } : null, error: null };
    if (table === "projects") return { data: state.project ? { ...state.project } : null, error: null };
    return { data: null, error: null };
  }

  if (operation === "delete" && table === "payments") {
    state.paymentDeleted = true;
    return { data: null, error: null };
  }

  if (operation === "update" && table === "promo_codes" && state.promo) {
    if (state.consumeFails || !filtersMatch(filters, state.promo as unknown as Record<string, unknown>)) {
      return { data: null, error: null };
    }
    Object.assign(state.promo, values);
    return { data: { id: state.promo.id }, error: null };
  }

  if (operation === "update" && table === "projects") {
    state.projectUpdate = values;
    return { data: null, error: state.projectUpdateError };
  }

  return { data: null, error: null };
}

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(() => ({ userId: 1, role: "user" })),
  hasMinRole: vi.fn(() => false),
}));

vi.mock("@/lib/firebase", () => ({
  getSupabase: vi.fn(() => ({
    from: (table: string) => {
      const filters: Array<{ field: string; value: unknown }> = [];
      let operation: "select" | "update" | "delete" = "select";
      let values: Record<string, unknown> | null = null;

      const builder = {
        select: () => builder,
        ilike: (field: string, value: string) => {
          filters.push({ field, value: value.toLowerCase() });
          return builder;
        },
        eq: (field: string, value: unknown) => {
          filters.push({ field, value });
          return builder;
        },
        update: (next: Record<string, unknown>) => {
          operation = "update";
          values = next;
          return builder;
        },
        delete: () => {
          operation = "delete";
          return builder;
        },
        maybeSingle: async () => execute(table, operation, filters, values),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(execute(table, operation, filters, values)).then(resolve, reject),
      };

      return builder;
    },
  })),
}));

vi.mock("@/lib/payments", () => ({
  verifyStellarPayment: vi.fn(),
  recordPayment: vi.fn(),
}));

import { verifyStellarPayment, recordPayment } from "@/lib/payments";
import { GET as quoteGET } from "./quote/route";
import { POST as activatePOST } from "./activate/route";

const TX_HASH = "a".repeat(64);
const AUTH = { Authorization: "Bearer test-token" };

function quoteRequest(query: string) {
  return new Request(`http://localhost/api/featured/quote?${query}`);
}

function activateRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/featured/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...AUTH },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  state.promo = {
    id: 7,
    code: "SUMMER",
    percent_off: 25,
    max_uses: 10,
    uses: 0,
    expires_at: "2099-01-01T00:00:00.000Z",
    active: true,
  };
  state.project = {
    numericId: 1,
    user_id: 1,
    name: "Test project",
    featured_expires_at: null,
  };
  state.projectUpdate = null;
  state.projectUpdateError = null;
  state.consumeFails = false;
  state.paymentDeleted = false;
  vi.clearAllMocks();
  vi.mocked(verifyStellarPayment).mockResolvedValue({
    txHash: TX_HASH,
    amountXlm: "50.0000000",
    sourceAddress: "GSOURCE",
    destinationAddress: "GDEST",
    network: "testnet",
  });
  vi.mocked(recordPayment).mockResolvedValue(undefined);
});

describe("GET /api/featured/quote", () => {
  it("returns the discounted price for a valid code", async () => {
    const response = await quoteGET(quoteRequest("code=summer&days=30"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      valid: true,
      code: "SUMMER",
      percent_off: 25,
      base_price: 50,
      discount_amount: 12.5,
      final_price: 37.5,
      days: 30,
    });
  });

  it("defaults to the 30-day spotlight price when no tier is supplied", async () => {
    const response = await quoteGET(quoteRequest("code=summer"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      base_price: 50,
      discount_amount: 12.5,
      final_price: 37.5,
      days: 30,
    });
  });

  it("rejects expired, exhausted and inactive codes", async () => {
    state.promo!.expires_at = "2000-01-01T00:00:00.000Z";
    let response = await quoteGET(quoteRequest("code=SUMMER&days=30"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Promo code has expired");

    state.promo!.expires_at = "2099-01-01T00:00:00.000Z";
    state.promo!.uses = 10;
    response = await quoteGET(quoteRequest("code=SUMMER&days=30"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Promo code has reached its usage limit");

    state.promo!.uses = 0;
    state.promo!.active = false;
    response = await quoteGET(quoteRequest("code=SUMMER&days=30"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Promo code is not active");
  });

  it("rejects unsupported durations and unknown codes", async () => {
    let response = await quoteGET(quoteRequest("code=SUMMER&days=12"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Unsupported spotlight duration");

    state.promo = null;
    response = await quoteGET(quoteRequest("code=MISSING&days=30"));
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Invalid promo code");
  });
});

describe("POST /api/featured/activate with promo codes", () => {
  it("activates a 100% code without a payment and consumes one use", async () => {
    state.promo!.percent_off = 100;

    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, promoCode: "summer" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(verifyStellarPayment).not.toHaveBeenCalled();
    expect(recordPayment).not.toHaveBeenCalled();
    expect(state.promo!.uses).toBe(1);
    expect(state.projectUpdate).toMatchObject({
      featured: 1,
      status: "featured",
      featured_tx_hash: null,
      featured_amount: 0,
      promo_code: "SUMMER",
    });
    expect(body).toMatchObject({
      success: true,
      price_xlm: 0,
      base_price: 50,
      discount_xlm: 50,
      promo_code: "SUMMER",
      featured_tx_hash: null,
    });
  });

  it("charges the discounted amount and records that amount", async () => {
    vi.mocked(verifyStellarPayment).mockResolvedValue({
      txHash: TX_HASH,
      amountXlm: "37.5000000",
      sourceAddress: "GSOURCE",
      destinationAddress: "GDEST",
      network: "testnet",
    });

    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, tx_hash: TX_HASH, promoCode: "SUMMER" }),
    );

    expect(response.status).toBe(200);
    expect(verifyStellarPayment).toHaveBeenCalledWith(TX_HASH, 37.5);
    expect(recordPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        tx_hash: TX_HASH,
        product: "spotlight",
        amount: "37.5000000",
        duration_days: 30,
      }),
      { projectName: "Test project" },
    );
    expect(state.promo!.uses).toBe(1);
    expect(state.projectUpdate).toMatchObject({ featured_amount: 37.5 });
  });

  it("requires payment when a promo leaves a balance", async () => {
    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, promoCode: "SUMMER" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(
      "A valid Stellar transaction hash is required",
    );
    expect(verifyStellarPayment).not.toHaveBeenCalled();
    expect(state.promo!.uses).toBe(0);
  });

  it("rejects an expired code without charging or activating", async () => {
    state.promo!.expires_at = "2000-01-01T00:00:00.000Z";

    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, tx_hash: TX_HASH, promoCode: "SUMMER" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Promo code has expired");
    expect(verifyStellarPayment).not.toHaveBeenCalled();
    expect(state.promo!.uses).toBe(0);
    expect(state.projectUpdate).toBeNull();
  });

  it("rejects an exhausted code without charging or activating", async () => {
    state.promo!.uses = 10;

    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, tx_hash: TX_HASH, promoCode: "SUMMER" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(
      "Promo code has reached its usage limit",
    );
    expect(verifyStellarPayment).not.toHaveBeenCalled();
    expect(state.projectUpdate).toBeNull();
  });

  it("returns 409 when a concurrent request already consumed the last use", async () => {
    state.consumeFails = true;

    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, tx_hash: TX_HASH, promoCode: "SUMMER" }),
    );

    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe(
      "Promo code has reached its usage limit",
    );
    expect(verifyStellarPayment).not.toHaveBeenCalled();
    expect(state.projectUpdate).toBeNull();
  });

  it("releases the claimed use when payment verification fails", async () => {
    vi.mocked(verifyStellarPayment).mockRejectedValue(new Error("wrong amount"));

    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, tx_hash: TX_HASH, promoCode: "SUMMER" }),
    );

    expect(response.status).toBe(500);
    expect(state.promo!.uses).toBe(0);
    expect(state.projectUpdate).toBeNull();
  });

  it("keeps the full price when no promo is supplied", async () => {
    const response = await activatePOST(
      activateRequest({ project_id: 1, days: 30, tx_hash: TX_HASH }),
    );

    expect(response.status).toBe(200);
    expect(verifyStellarPayment).toHaveBeenCalledWith(TX_HASH, 50);
    expect(state.promo!.uses).toBe(0);
    expect(state.projectUpdate).toMatchObject({
      featured_amount: 50,
      promo_code: null,
    });
  });
});
