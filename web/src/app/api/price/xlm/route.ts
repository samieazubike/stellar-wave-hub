export const dynamic = "force-dynamic";

interface CachedPrice {
  price: number;
  timestamp: number;
}

let priceCache: CachedPrice | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const FETCH_TIMEOUT_MS = 4000; // 4 seconds timeout

/**
 * Reset or set cache (primarily for testing purposes)
 */
export function _resetPriceCache(mock?: { price: number; timestamp?: number } | null) {
  if (mock) {
    priceCache = {
      price: mock.price,
      timestamp: mock.timestamp ?? Date.now(),
    };
  } else {
    priceCache = null;
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch XLM/USD price from public market data providers with timeout and fallback.
 */
async function fetchCurrentXlmPrice(): Promise<number> {
  // Primary: Binance XLM/USDT
  try {
    const res = await fetchWithTimeout(
      "https://api.binance.com/api/v3/ticker/price?symbol=XLMUSDT",
      FETCH_TIMEOUT_MS,
    );
    if (res.ok) {
      const data = (await res.json()) as { price?: string };
      const parsed = parseFloat(data.price || "");
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Fall through to secondary
  }

  // Secondary: Coinbase XLM-USD spot price
  try {
    const res = await fetchWithTimeout(
      "https://api.coinbase.com/v2/prices/XLM-USD/spot",
      FETCH_TIMEOUT_MS,
    );
    if (res.ok) {
      const data = (await res.json()) as { data?: { amount?: string } };
      const parsed = parseFloat(data.data?.amount || "");
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Fall through to tertiary
  }

  // Tertiary: CoinGecko
  try {
    const res = await fetchWithTimeout(
      "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd",
      FETCH_TIMEOUT_MS,
    );
    if (res.ok) {
      const data = (await res.json()) as { stellar?: { usd?: number } };
      const parsed = data.stellar?.usd;
      if (typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Handled below
  }

  throw new Error("All XLM price feed sources failed or timed out");
}

export async function GET() {
  const now = Date.now();

  // Check valid cache
  if (priceCache && now - priceCache.timestamp < CACHE_TTL_MS) {
    return Response.json({
      price: priceCache.price,
      currency: "USD",
      cached: true,
      updatedAt: new Date(priceCache.timestamp).toISOString(),
    });
  }

  // Fetch fresh price
  try {
    const freshPrice = await fetchCurrentXlmPrice();
    priceCache = {
      price: freshPrice,
      timestamp: now,
    };

    return Response.json({
      price: freshPrice,
      currency: "USD",
      cached: false,
      updatedAt: new Date(now).toISOString(),
    });
  } catch (err) {
    // If fetch failed but we have stale cache, serve stale cache gracefully
    if (priceCache) {
      return Response.json({
        price: priceCache.price,
        currency: "USD",
        cached: true,
        stale: true,
        updatedAt: new Date(priceCache.timestamp).toISOString(),
      });
    }

    console.error("XLM price feed error:", err);
    return Response.json(
      { error: "Price feed unavailable" },
      { status: 503 },
    );
  }
}
