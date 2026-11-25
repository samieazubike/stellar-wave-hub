import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

function explorerTxUrl(hash: string, network: string = "mainnet"): string {
  const base =
    network === "testnet"
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";
  return `${base}/tx/${hash}`;
}

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const rangeParam = (url.searchParams.get("range") || "30d").toLowerCase();

    const now = new Date();
    let cutoffDate: Date | null = null;

    if (rangeParam === "7d") {
      cutoffDate = new Date(now.getTime() - 7 * 86400 * 1000);
    } else if (rangeParam === "30d") {
      cutoffDate = new Date(now.getTime() - 30 * 86400 * 1000);
    } else if (rangeParam === "90d") {
      cutoffDate = new Date(now.getTime() - 90 * 86400 * 1000);
    } else if (rangeParam === "all") {
      cutoffDate = null;
    } else {
      cutoffDate = new Date(now.getTime() - 30 * 86400 * 1000);
    }

    const supabase = getSupabase();

    // Query payments ledger
    let query = supabase
      .from("payments")
      .select("*");

    if (cutoffDate) {
      query = query.gte("created_at", cutoffDate.toISOString());
    }

    const { data: paymentsData, error: paymentsError } = await query.order(
      "created_at",
      { ascending: false },
    );
    if (paymentsError) throw paymentsError;

    const payments = paymentsData || [];

    // Fetch projects for name/slug enrichment
    const projectIds = Array.from(
      new Set(
        payments
          .map((p) => Number(p.project_id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );

    const projectMap = new Map<number, { name: string; slug: string }>();
    if (projectIds.length > 0) {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("numericId, name, slug")
        .in("numericId", projectIds);

      if (!projectsError && projectsData) {
        for (const p of projectsData) {
          projectMap.set(Number(p.numericId), {
            name: p.name,
            slug: p.slug,
          });
        }
      }
    }

    let totalRevenue = 0;
    let activeSpotlights = 0;
    let expiredSpotlights = 0;

    const byProductMap = new Map<string, { product: string; revenue: number; count: number }>();
    const dailyMap = new Map<string, { date: string; label: string; revenue: number; count: number }>();
    const monthlyMap = new Map<string, { month: string; revenue: number; count: number }>();
    const payerMap = new Map<string, { user_id: number; address: string; total_amount: number; count: number }>();

    const purchases = payments.map((row) => {
      const amount = Number(row.amount);
      totalRevenue += amount;

      const durationDays = Number(row.duration_days || 30);
      const createdAt = new Date(row.created_at || now);
      const expiresAt = new Date(createdAt.getTime() + durationDays * 86400 * 1000);
      const isExpired = expiresAt <= now;
      const status: "active" | "expired" = isExpired ? "expired" : "active";

      if (status === "active") {
        activeSpotlights += 1;
      } else {
        expiredSpotlights += 1;
      }

      // Product breakdown
      const product = row.product || "spotlight";
      if (!byProductMap.has(product)) {
        byProductMap.set(product, { product, revenue: 0, count: 0 });
      }
      const prodEntry = byProductMap.get(product)!;
      prodEntry.revenue += amount;
      prodEntry.count += 1;

      // Daily time series
      const dateKey = createdAt.toISOString().split("T")[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          label: createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          revenue: 0,
          count: 0,
        });
      }
      const dayEntry = dailyMap.get(dateKey)!;
      dayEntry.revenue += amount;
      dayEntry.count += 1;

      // Monthly aggregation
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, revenue: 0, count: 0 });
      }
      const m = monthlyMap.get(monthKey)!;
      m.revenue += amount;
      m.count += 1;

      // Payer aggregation
      const payerKey = String(row.user_id || row.source_address || "anonymous");
      if (!payerMap.has(payerKey)) {
        payerMap.set(payerKey, {
          user_id: Number(row.user_id),
          address: row.source_address || `User #${row.user_id}`,
          total_amount: 0,
          count: 0,
        });
      }
      const payer = payerMap.get(payerKey)!;
      payer.total_amount += amount;
      payer.count += 1;

      const proj = projectMap.get(Number(row.project_id));
      const network = row.network || "mainnet";

      return {
        id: Number(row.id),
        project_id: Number(row.project_id),
        project_name: proj?.name || `Project #${row.project_id}`,
        project_slug: proj?.slug || null,
        tx_hash: row.tx_hash,
        product,
        amount,
        duration_days: durationDays,
        user_id: Number(row.user_id),
        source_address: row.source_address,
        stellar_network: network,
        explorer_url: explorerTxUrl(row.tx_hash, network),
        status,
        purchased_at: row.created_at,
        expires_at: expiresAt.toISOString(),
      };
    });

    const timeSeries = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const revenueOverTime = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    const topPayers = Array.from(payerMap.values()).sort(
      (a, b) => b.total_amount - a.total_amount,
    );

    const avgPayment =
      payments.length > 0 ? Number((totalRevenue / payments.length).toFixed(4)) : 0;

    return Response.json({
      summary: {
        total_revenue: totalRevenue,
        total_transactions: payments.length,
        total_purchases: payments.length,
        average_payment: avgPayment,
        active_spotlights: activeSpotlights,
        expired_spotlights: expiredSpotlights,
        range: rangeParam,
      },
      by_product: Array.from(byProductMap.values()),
      top_payers: topPayers,
      time_series: timeSeries,
      revenue_over_time: revenueOverTime,
      purchases,
    });
  } catch (err) {
    console.error("Admin revenue summary error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
