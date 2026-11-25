import { xlmToStroops } from "@/lib/featured-pricing";

export interface ProStatusFields {
  is_pro?: boolean | number | null;
  pro_until?: string | null;
  plan?: string | null;
}

export const FREE_RESEARCH_IMAGE_LIMIT = 10;
export const PRO_RESEARCH_IMAGE_LIMIT = 12;

/**
 * Determines whether a project currently has an active Pro plan.
 */
export function isPro(
  project?: ProStatusFields | null,
  now: number = Date.now(),
): boolean {
  if (!project) return false;

  if (project.pro_until !== undefined && project.pro_until !== null) {
    const expiresAt = Date.parse(project.pro_until);
    return !Number.isNaN(expiresAt) && expiresAt > now;
  }

  if (project.is_pro === true || project.is_pro === 1) {
    return true;
  }

  if (typeof project.plan === "string" && project.plan.toLowerCase() === "pro") {
    return true;
  }

  return false;
}

export function getResearchImageLimit(
  project?: ProStatusFields | null,
  now: number = Date.now(),
): number {
  return isPro(project, now)
    ? PRO_RESEARCH_IMAGE_LIMIT
    : FREE_RESEARCH_IMAGE_LIMIT;
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
