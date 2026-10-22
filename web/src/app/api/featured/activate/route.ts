import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
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
    const body = await request.json();
    const { project_id, promo_code, base_price, tx_hash, duration_days, gift } =
      body || {};

    if (!project_id || isNaN(Number(project_id))) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    const isGift = gift === true || gift === "true" || gift === 1;

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

    const isOwner = project.user_id === auth.userId;
    const isAdmin = hasMinRole(auth.role, "admin");

    // Owners and admins may always activate. Non-owners may only activate
    // when gifting a spotlight (paying for someone else's project).
    if (!isOwner && !isAdmin && !isGift) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Gifting only applies to approved projects.
    if (isGift && !project.featured) {
      const approvedStatuses = ["approved", "featured", "listed"];
      if (!approvedStatuses.includes(String(project.status))) {
        return Response.json(
          { error: "Project is not approved" },
          { status: 400 }
        );
      }
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
    }

    // Payment verification. Never trust a client-supplied amount; always
    // verify on Horizon. The unique tx_hash in the payments table ensures
    // a payment can only be saved/redeemed once.
    const txHash = tx_hash ? String(tx_hash).trim() : "";

    if (!isAdmin) {
      if (!txHash) {
        return Response.json({ error: "Payment transaction hash is required" }, { status: 400 });
      }

      // Reject already-redeemed transactions before hitting Horizon.
      const { data: existingPayment, error: payError } = await supabase
        .from("payments")
        .select("id")
        .eq("tx_hash", txHash)
        .maybeSingle();

      if (payError) throw payError;
      if (existingPayment) {
        return Response.json(
          { error: "Payment has already been redeemed" },
          { status: 409 }
        );
      }

      // Verify the payment against Horizon. The amount must meet or exceed
      // the server-computed final price.
      const verification = await verifyStellarPayment({
        txHash,
        amount: finalPrice,
        network: project.stellar_network,
      });

      if (!verification || !verification.valid) {
        return Response.json(
          { error: "Payment verification failed" },
          { status: 400 }
        );
      }

      // Record the redemption. The unique tx_hash constraint guarantees a
      // payment can only be redeemed once, even under concurrent requests.
      const { error: insertError } = await supabase.from("payments").insert({
        tx_hash,
        product: "spotlight",
        user_id: auth.userId,
        project_id: Number(project_id),
        amount: finalPrice,
        gifted: isGift ? 1 : 0,
      });

      if (insertError) {
        // Unique violation on tx_hash -> already redeemed.
        if ((insertError as { code?: string }).code === "23505") {
          return Response.json({ error: "Payment has already been redeemed" }, {
            status: 409,
          });
        }
        throw insertError;
      }
    }

    // Increment promo code usage by code (only when a promo was applied).
    if (appliedPromo) {
      await supabase
        .from("promo_codes")
        .update({ uses: (appliedPromo.uses ?? 0) + 1 })
        .ilike("code", appliedPromo.code);
    }

    // Activate featured spotlight for project.
    const now = new Date();
    const days = Number(duration_days) > 0 ? Number(duration_days) : 30;
    const expiresAt = new Date(now.getTime() + days * 86400 * 1000).toISOString();
    const finalTxHash = txHash || `spotlight_tx_${Date.now()}`;

    // Record the gifter's user_id when this is a gift. Otherwise clear
    // any prior gifter so the credit reflects the current spotlight.
    const giftedBy = isGift ? auth.userId : null;

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        featured: 1,
        status: "featured",
        featured_tx_hash: finalTxHash,
        featured_amount: finalPrice,
        featured_expires_at: expiresAt,
        promo_code: appliedPromo ? appliedPromo.code : null,
        gifted_by: giftedBy,
        updated_at: now.toISOString(),
      })
      .eq("numericId", Number(project_id));

    if (updateError) throw updateError;

    return Response.json({
      success: true,
      project_id: Number(project_id),
      featured: 1,
      featured_tx_hash: finalTxHash,
      base_price: basePrice,
      final_price: finalPrice,
      expires_at: expiresAt,
      promo_code: appliedPromo ? appliedPromo.code : null,
      gift: isGift,
      gifted_by: giftedBy,
    });
  } catch (err) {
    console.error("Activate featured project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
