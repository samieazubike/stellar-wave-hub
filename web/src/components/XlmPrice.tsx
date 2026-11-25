"use client";

import { useEffect, useState } from "react";

export interface XlmPriceProps {
  amount: number;
  className?: string;
  prefix?: string;
}

// Client-side shared price state to prevent redundant requests
let globalXlmPrice: number | null = null;
let globalPriceFetchPromise: Promise<number | null> | null = null;

export function fetchClientXlmPrice(): Promise<number | null> {
  if (globalXlmPrice !== null) {
    return Promise.resolve(globalXlmPrice);
  }

  if (globalPriceFetchPromise) {
    return globalPriceFetchPromise;
  }

  globalPriceFetchPromise = fetch("/api/price/xlm")
    .then(async (res) => {
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      if (typeof data.price === "number" && data.price > 0) {
        globalXlmPrice = data.price;
        return data.price;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      globalPriceFetchPromise = null;
    });

  return globalPriceFetchPromise;
}

/**
 * Reset client price cache (primarily for tests)
 */
export function _resetClientPriceCache(price: number | null = null) {
  globalXlmPrice = price;
  globalPriceFetchPromise = null;
}

export function formatUsdEstimate(amount: number, unitPrice: number): string {
  const total = amount * unitPrice;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: total < 0.01 && total > 0 ? 4 : 2,
  }).format(total);
}

export function XlmPrice({ amount, className = "text-ash text-xs ml-1.5", prefix = "≈ " }: XlmPriceProps) {
  const [price, setPrice] = useState<number | null>(() => globalXlmPrice);

  useEffect(() => {
    let mounted = true;
    if (globalXlmPrice !== null) {
      return;
    }

    fetchClientXlmPrice().then((p) => {
      if (mounted) {
        setPrice(p);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Acceptance criteria: hidden if the feed is down (or while loading / unavailable)
  if (price === null || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const formatted = formatUsdEstimate(amount, price);

  return (
    <span className={className} data-testid="xlm-usd-estimate">
      {prefix}{formatted}
    </span>
  );
}

export default XlmPrice;
