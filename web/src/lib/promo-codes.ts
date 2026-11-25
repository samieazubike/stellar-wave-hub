import type { SupabaseClient } from "@supabase/supabase-js";

export interface PromoCode {
  id: number | string;
  code: string;
  percent_off: number;
  max_uses: number | null;
  uses: number | null;
  expires_at: string | null;
  active?: boolean | null;
}

export function normalizePromoCode(value: string): string {
  return value.trim().toUpperCase();
}

/** Why a promo code cannot be used right now, or null when it is usable. */
export function promoCodeRejection(
  promo: PromoCode,
  now = new Date(),
): string | null {
  if (promo.active === false) return "Promo code is not active";
  if (promo.expires_at && new Date(promo.expires_at) < now) {
    return "Promo code has expired";
  }
  if (
    promo.max_uses !== null &&
    promo.max_uses !== undefined &&
    (promo.uses ?? 0) >= promo.max_uses
  ) {
    return "Promo code has reached its usage limit";
  }
  return null;
}

export function applyPromoDiscount(basePrice: number, percentOff: number) {
  const discountAmount = Math.round(((basePrice * percentOff) / 100) * 1e7) / 1e7;
  const finalPrice = Math.max(0, Math.round((basePrice - discountAmount) * 1e7) / 1e7);
  return { discountAmount, finalPrice };
}

export async function findPromoCode(
  supabase: SupabaseClient,
  rawCode: string,
): Promise<PromoCode | null> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .ilike("code", normalizePromoCode(rawCode))
    .maybeSingle();

  if (error) throw error;
  return data as PromoCode | null;
}

/**
 * Atomically claim one use. The conditional `uses` filter makes concurrent
 * claims race safely: only the request that sees the expected value wins.
 */
export async function consumePromoCode(
  supabase: SupabaseClient,
  promo: PromoCode,
): Promise<boolean> {
  const currentUses = promo.uses ?? 0;
  const { data, error } = await supabase
    .from("promo_codes")
    .update({ uses: currentUses + 1 })
    .eq("id", promo.id)
    .eq("uses", currentUses)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/** Put a claimed use back when activation fails after the claim. */
export async function releasePromoCode(
  supabase: SupabaseClient,
  promo: PromoCode,
): Promise<void> {
  const currentUses = promo.uses ?? 0;
  const { error } = await supabase
    .from("promo_codes")
    .update({ uses: currentUses })
    .eq("id", promo.id)
    .eq("uses", currentUses + 1);

  if (error) throw error;
}
