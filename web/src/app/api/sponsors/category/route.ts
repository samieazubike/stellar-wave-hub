import { getSupabase } from "@/lib/firebase";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { categorySponsorBookingSchema } from "@/lib/validation/schemas/category-sponsors";
import { verifyStellarPayment } from "@/lib/payments";
import { getCategorySponsorPriceXlm } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * Validates whether the Stellar transaction memo matches the required format:
 * memo cat::<category> or cat:<category> or cat::<category>:<projectId> or cat::
 */
function isMemoMatchingCategory(memo: string, category: string, projectId: number): boolean {
  const m = memo.trim().toLowerCase();
  const cat = category.trim().toLowerCase();

  if (!m.startsWith("cat:") && !m.startsWith("cat::")) {
    return false;
  }

  const payload = m.startsWith("cat::") ? m.slice(5) : m.slice(4);
  if (!payload) {
    return true; // Accepted literal prefix "cat::" or "cat:"
  }

  const parts = payload.split(":");
  if (parts[0] !== cat) {
    return false;
  }

  if (parts.length > 1 && parts[1]) {
    return Number(parts[1]) === projectId;
  }

  return true;
}

/**
 * POST /api/sponsors/category
 * Verifies Stellar payment on Horizon (memo cat::) and books the next free week.
 * Enforces:
 *   - Only one active sponsor per category
 *   - Double-booking is rejected
 *   - Payment tx_hash can only be redeemed once
 *   - Payment amount is verified on Horizon against required price
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, categorySponsorBookingSchema);
    if (!parsed.success) {
      return parsed.response;
    }

    const { category: rawCategory, project_id, tx_hash, starts_at: customStartsAt } = parsed.data;
    const category = rawCategory.toLowerCase().trim();
    const db = getSupabase();

    // 1. Verify project exists
    const { data: project, error: projectError } = await db
      .from("projects")
      .select("*")
      .eq("numericId", project_id)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Check if payment has already been redeemed
    const { data: existingPayment } = await db
      .from("payments")
      .select("id, tx_hash")
      .eq("tx_hash", tx_hash)
      .maybeSingle();

    if (existingPayment) {
      return Response.json(
        { error: "Payment transaction has already been redeemed" },
        { status: 409 },
      );
    }

    const { data: existingSponsorTx } = await db
      .from("category_sponsors")
      .select("id, tx_hash")
      .eq("tx_hash", tx_hash)
      .maybeSingle();

    if (existingSponsorTx) {
      return Response.json(
        { error: "Payment transaction has already been redeemed" },
        { status: 409 },
      );
    }

    // 3. Verify on Horizon
    const requiredPrice = getCategorySponsorPriceXlm();
    let paymentDetails;
    try {
      paymentDetails = await verifyStellarPayment(tx_hash, {
        expectedAmount: requiredPrice,
        expectedMemo: (memo: string) => isMemoMatchingCategory(memo, category, project_id),
      });
    } catch (err: any) {
      return Response.json(
        { error: err.message || "Stellar payment verification failed" },
        { status: 400 },
      );
    }

    // 4. Calculate booking period & prevent double-booking
    const now = new Date();
    const nowIso = now.toISOString();

    // Fetch existing active/future bookings for this category
    const { data: futureBookings, error: queryError } = await db
      .from("category_sponsors")
      .select("*")
      .eq("category", category)
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending: false });

    if (queryError) throw queryError;

    let bookingStartsAt: Date;
    let bookingEndsAt: Date;

    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    if (customStartsAt) {
      bookingStartsAt = new Date(customStartsAt);
      bookingEndsAt = new Date(bookingStartsAt.getTime() + WEEK_MS);

      const hasOverlap = (futureBookings || []).some((b: any) => {
        const bStart = new Date(b.starts_at).getTime();
        const bEnd = new Date(b.ends_at).getTime();
        return bookingStartsAt.getTime() < bEnd && bookingEndsAt.getTime() > bStart;
      });

      if (hasOverlap) {
        return Response.json(
          { error: "Double-booking is rejected: time slot already booked" },
          { status: 409 },
        );
      }
    } else {
      // Book the next free week
      if (futureBookings && futureBookings.length > 0) {
        const latestEnd = new Date(futureBookings[0].ends_at);
        bookingStartsAt = latestEnd > now ? latestEnd : now;
      } else {
        bookingStartsAt = now;
      }
      bookingEndsAt = new Date(bookingStartsAt.getTime() + WEEK_MS);
    }

    // Atomic overlap check before insert
    const { data: overlapCheck } = await db
      .from("category_sponsors")
      .select("id")
      .eq("category", category)
      .lt("starts_at", bookingEndsAt.toISOString())
      .gt("ends_at", bookingStartsAt.toISOString())
      .limit(1);

    if (overlapCheck && overlapCheck.length > 0) {
      return Response.json(
        { error: "Double-booking is rejected: time slot already booked" },
        { status: 409 },
      );
    }

    // 5. Record payment redemption in payments table
    const { error: paymentInsertError } = await db.from("payments").insert({
      tx_hash,
      product: "category_sponsor",
      amount: paymentDetails.amount,
      metadata: {
        category,
        project_id,
        starts_at: bookingStartsAt.toISOString(),
        ends_at: bookingEndsAt.toISOString(),
      },
    });

    if (paymentInsertError) {
      if (paymentInsertError.code === "23505" || paymentInsertError.message?.includes("unique")) {
        return Response.json(
          { error: "Payment transaction has already been redeemed" },
          { status: 409 },
        );
      }
      throw paymentInsertError;
    }

    // 6. Record category sponsor
    const { data: sponsorRow, error: sponsorInsertError } = await db
      .from("category_sponsors")
      .insert({
        category,
        project_id,
        starts_at: bookingStartsAt.toISOString(),
        ends_at: bookingEndsAt.toISOString(),
        tx_hash,
      })
      .select("*")
      .single();

    if (sponsorInsertError) {
      if (sponsorInsertError.code === "23505" || sponsorInsertError.message?.includes("unique")) {
        return Response.json(
          { error: "Double-booking is rejected: transaction or slot conflict" },
          { status: 409 },
        );
      }
      throw sponsorInsertError;
    }

    return Response.json(
      {
        success: true,
        sponsor: sponsorRow,
        message: "Category sponsor booked successfully",
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/sponsors/category error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/sponsors/category
 * Query param: ?category=<category>
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const categoryParam = url.searchParams.get("category");
    const db = getSupabase();
    const now = new Date().toISOString();

    if (categoryParam) {
      const category = categoryParam.toLowerCase().trim();
      const { data: sponsors, error } = await db
        .from("category_sponsors")
        .select("*")
        .eq("category", category)
        .lte("starts_at", now)
        .gt("ends_at", now)
        .order("starts_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      const sponsor = sponsors && sponsors.length > 0 ? sponsors[0] : null;

      if (!sponsor) {
        return Response.json({ sponsor: null });
      }

      const { data: project } = await db
        .from("projects")
        .select("*")
        .eq("numericId", sponsor.project_id)
        .maybeSingle();

      return Response.json({
        sponsor: {
          ...sponsor,
          project: project ? { ...project, id: project.numericId } : null,
        },
      });
    }

    // Return all currently active sponsors
    const { data: sponsors, error } = await db
      .from("category_sponsors")
      .select("*")
      .lte("starts_at", now)
      .gt("ends_at", now);

    if (error) throw error;
    return Response.json({ sponsors: sponsors || [] });
  } catch (err: any) {
    console.error("GET /api/sponsors/category error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
