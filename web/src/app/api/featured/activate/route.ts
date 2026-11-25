import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { getFeaturedTiers } from "@/lib/featured-pricing";
import { verifyStellarPayment } from "@/lib/payments";

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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { project_id, days, tx_hash } =
      body && typeof body === "object" ? body as Record<string, unknown> : {};

    if (
      typeof project_id !== "number" ||
      !Number.isSafeInteger(project_id) ||
      project_id <= 0
    ) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }
    if (typeof days !== "number" || !Number.isInteger(days)) {
      return Response.json({ error: "A spotlight duration is required" }, { status: 400 });
    }
    if (typeof tx_hash !== "string" || !/^[a-f0-9]{64}$/i.test(tx_hash)) {
      return Response.json({ error: "A valid Stellar transaction hash is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select('"numericId",user_id')
      .eq("numericId", Number(project_id))
      .maybeSingle();

    if (projError) throw projError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (Number(project.user_id) !== auth.userId && !hasMinRole(auth.role, "admin")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const tier = getFeaturedTiers().find((candidate) => candidate.days === days);
    if (!tier) {
      return Response.json({ error: "Unsupported spotlight duration" }, { status: 400 });
    }

    const payment = await verifyStellarPayment(tx_hash, tier.priceXlm);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 86400 * 1000).toISOString();

    const { error: paymentError } = await supabase.from("payments").insert({
      tx_hash: payment.txHash,
      product: "spotlight",
      user_id: auth.userId,
      project_id: Number(project_id),
      amount: payment.amountXlm,
      duration_days: days,
      source_address: payment.sourceAddress,
      destination_address: payment.destinationAddress,
      network: payment.network,
      created_at: now.toISOString(),
    });
    if (paymentError?.code === "23505") {
      return Response.json({ error: "This transaction has already been redeemed" }, { status: 409 });
    }
    if (paymentError) throw paymentError;

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        featured: 1,
        status: "featured",
        featured_tx_hash: payment.txHash,
        featured_amount: tier.priceXlm,
        featured_expires_at: expiresAt,
        promo_code: null,
        updated_at: now.toISOString(),
      })
      .eq("numericId", Number(project_id));

    if (updateError) {
      const { error: cleanupError } = await supabase
        .from("payments")
        .delete()
        .eq("tx_hash", payment.txHash);
      if (cleanupError) {
        console.error("Failed to release unactivated spotlight payment:", cleanupError);
      }
      throw updateError;
    }

    return Response.json({
      success: true,
      project_id: Number(project_id),
      featured: 1,
      featured_tx_hash: payment.txHash,
      price_xlm: tier.priceXlm,
      days,
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error("Activate featured project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
