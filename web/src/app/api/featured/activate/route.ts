import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const promoCode = url.searchParams.get("promo_code");

    if (!promoCode || !promoCode.trim()) {
      return Response.json({ error: "Promo code is required" }, { status: 400 });
    }

    const code = promoCode.trim().toUpperCase();
    const supabase = getSupabase();

    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .maybeSingle();

    if (error) throw error;

    if (!promo) {
      return Response.json({ error: "Invalid promo code" }, { status: 404 });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return Response.json({ error: "Promo code has expired" }, { status: 400 });
    }

    if (
      promo.max_uses !== null &&
      promo.max_uses !== undefined &&
      (promo.uses ?? 0) >= promo.max_uses
    ) {
      return Response.json(
        { error: "Promo code has reached its usage limit" },
        { status: 400 }
      );
    }

    const basePrice = Number(url.searchParams.get("base_price")) || 100;
    const percentOff = Number(promo.percent_off);
    const discountAmount = (basePrice * percentOff) / 100;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return Response.json({
      valid: true,
      code: promo.code,
      percent_off: percentOff,
      base_price: basePrice,
      final_price: finalPrice,
    });
  } catch (err) {
    console.error("Validate promo code error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { project_id, promo_code, base_price, tx_hash, duration_days } = body || {};

    if (!project_id || isNaN(Number(project_id))) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("numericId", Number(project_id))
      .maybeSingle();

    if (projError) throw projError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== auth.userId && !hasMinRole(auth.role, "admin")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const basePrice = Number(base_price) || 100;
    let finalPrice = basePrice;
    let appliedPromo: { code: string; percent_off: number; uses: number } | null = null;

    if (promo_code && typeof promo_code === "string" && promo_code.trim()) {
      const code = promo_code.trim().toUpperCase();
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .ilike("code", code)
        .maybeSingle();

      if (promoError) throw promoError;

      if (!promo) {
        return Response.json({ error: "Invalid promo code" }, { status: 400 });
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return Response.json({ error: "Promo code has expired" }, { status: 400 });
      }

      if (
        promo.max_uses !== null &&
        promo.max_uses !== undefined &&
        (promo.uses ?? 0) >= promo.max_uses
      ) {
        return Response.json(
          { error: "Promo code has reached its usage limit" },
          { status: 400 }
        );
      }

      const percentOff = Number(promo.percent_off);
      finalPrice = Math.max(0, basePrice - (basePrice * percentOff) / 100);
      appliedPromo = promo;

      // Increment promo code usage by code
      await supabase
        .from("promo_codes")
        .update({ uses: (promo.uses ?? 0) + 1 })
        .ilike("code", promo.code);
    }

    // Activate featured spotlight for project
    const now = new Date();
    const days = Number(duration_days) > 0 ? Number(duration_days) : 30;
    const expiresAt = new Date(now.getTime() + days * 86400 * 1000).toISOString();
    const txHash = tx_hash ? String(tx_hash).trim() : `spotlight_tx_${Date.now()}`;

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        featured: 1,
        status: "featured",
        featured_tx_hash: txHash,
        featured_amount: finalPrice,
        featured_expires_at: expiresAt,
        promo_code: appliedPromo ? appliedPromo.code : null,
        updated_at: now.toISOString(),
      })
      .eq("numericId", Number(project_id));

    if (updateError) throw updateError;

    return Response.json({
      success: true,
      project_id: Number(project_id),
      featured: 1,
      featured_tx_hash: txHash,
      base_price: basePrice,
      final_price: finalPrice,
      expires_at: expiresAt,
      promo_code: appliedPromo ? appliedPromo.code : null,
    });
  } catch (err) {
    console.error("Activate featured project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
