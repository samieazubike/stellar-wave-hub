export const DEFAULT_CATEGORY_SPONSOR_PRICE_XLM = 40;

/**
 * Returns the current category sponsor price in XLM.
 * Defaults to 40 XLM if NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM is not configured.
 */
export function getCategorySponsorPriceXlm(): number {
  const envVal = process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM;
  if (envVal) {
    const parsed = Number(envVal);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_CATEGORY_SPONSOR_PRICE_XLM;
}
