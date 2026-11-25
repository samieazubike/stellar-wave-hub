import { xlmToStroops } from "@/lib/featured-pricing";

export function isPro(project: { pro_until?: string | null }, now = Date.now()): boolean {
  if (!project.pro_until) return false;
  const expiresAt = new Date(project.pro_until).getTime();
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function getProPriceXlm(
  value = process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM,
): number {
  const price = (value ?? "200").trim();
  if (!/^(0|[1-9]\d*)(?:\.\d{1,7})?$/.test(price)) {
    throw new Error("NEXT_PUBLIC_PRICE_PRO_YEAR_XLM must be a positive XLM amount");
  }

  const stroops = xlmToStroops(price);
  const priceXlm = Number(price);
  if (stroops <= BigInt(0) || !Number.isFinite(priceXlm)) {
    throw new Error("NEXT_PUBLIC_PRICE_PRO_YEAR_XLM must be a positive XLM amount");
  }
  return priceXlm;
}
