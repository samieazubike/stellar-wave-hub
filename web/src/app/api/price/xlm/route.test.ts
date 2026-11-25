import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, _resetPriceCache } from "./route";
import { formatUsdEstimate } from "@/components/XlmPrice";

describe("GET /api/price/xlm", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    _resetPriceCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    _resetPriceCache();
    vi.restoreAllMocks();
  });

  it("fetches live XLM price successfully from Binance", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("api.binance.com")) {
        return {
          ok: true,
          json: async () => ({ symbol: "XLMUSDT", price: "0.12500000" }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.price).toBe(0.125);
    expect(body.currency).toBe("USD");
    expect(body.cached).toBe(false);
    expect(body.updatedAt).toBeDefined();
  });

  it("falls back to Coinbase if Binance fails", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("api.binance.com")) {
        return { ok: false, status: 500 } as unknown as Response;
      }
      if (url.includes("api.coinbase.com")) {
        return {
          ok: true,
          json: async () => ({ data: { base: "XLM", currency: "USD", amount: "0.132" } }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.price).toBe(0.132);
    expect(body.currency).toBe("USD");
    expect(body.cached).toBe(false);
  });

  it("serves from cache on subsequent calls within 10 minutes", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ price: "0.120" }),
      } as unknown as Response;
    });
    global.fetch = fetchMock;

    // First call (fetches live)
    const firstRes = await GET();
    expect(firstRes.status).toBe(200);
    const firstBody = await firstRes.json();
    expect(firstBody.cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call (uses cache)
    const secondRes = await GET();
    expect(secondRes.status).toBe(200);
    const secondBody = await secondRes.json();
    expect(secondBody.cached).toBe(true);
    expect(secondBody.price).toBe(0.120);
    expect(fetchMock).toHaveBeenCalledTimes(1); // No new network request
  });

  it("refetches when cache is expired (> 10 minutes)", async () => {
    // Set a cache timestamp 11 minutes in the past
    _resetPriceCache({ price: 0.10, timestamp: Date.now() - 11 * 60 * 1000 });

    const fetchMock = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ price: "0.145" }),
      } as unknown as Response;
    });
    global.fetch = fetchMock;

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.price).toBe(0.145);
    expect(body.cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("serves stale cache if live feed fails", async () => {
    // Set a cache timestamp 11 minutes in the past
    _resetPriceCache({ price: 0.11, timestamp: Date.now() - 11 * 60 * 1000 });

    global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.price).toBe(0.11);
    expect(body.cached).toBe(true);
    expect(body.stale).toBe(true);
  });

  it("returns 503 if price feed fails and no cache exists", async () => {
    _resetPriceCache(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("Price feed unavailable");
  });
});

describe("formatUsdEstimate helper", () => {
  it("formats USD estimate correctly for standard amounts", () => {
    expect(formatUsdEstimate(50, 0.12)).toBe("$6.00");
    expect(formatUsdEstimate(15, 0.10)).toBe("$1.50");
    expect(formatUsdEstimate(120, 0.15)).toBe("$18.00");
  });

  it("formats fraction correctly", () => {
    const formatted = formatUsdEstimate(1, 0.1234);
    expect(formatted).toBe("$0.12");
  });
});
