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
    const supabase = getSupabase();

    // Query projects from database
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter featured project rows or rows with recorded spotlight transactions
    const rows = (data || []).filter(
      (row) => row.featured === 1 || Boolean(row.featured_tx_hash)
    );

    const now = new Date();
    let totalRevenue = 0;
    let activeSpotlights = 0;
    let expiredSpotlights = 0;

    const monthlyMap = new Map<string, { month: string; revenue: number; count: number }>();

    const purchases = rows.map((row) => {
      const amount = Number(row.featured_amount ?? 100);
      const isExpired =
        row.featured !== 1 ||
        (row.featured_expires_at && new Date(row.featured_expires_at) <= now);
      const status = isExpired ? "expired" : "active";

      if (status === "active") {
        activeSpotlights += 1;
      } else {
        expiredSpotlights += 1;
      }

      totalRevenue += amount;

      const dateObj = new Date(row.created_at || now);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, revenue: 0, count: 0 });
      }
      const m = monthlyMap.get(monthKey)!;
      m.revenue += amount;
      m.count += 1;

      const txHash = row.featured_tx_hash || row.stellar_account_id || `tx_spotlight_${row.numericId}`;
      const network = row.stellar_network || "mainnet";

      return {
        project_id: row.numericId,
        project_name: row.name,
        project_slug: row.slug,
        tx_hash: txHash,
        amount,
        stellar_network: network,
        explorer_url: explorerTxUrl(txHash, network),
        status,
        promo_code: row.promo_code || null,
        purchased_at: row.created_at,
        expires_at: row.featured_expires_at || null,
      };
    });

    const revenueOverTime = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return Response.json({
      summary: {
        total_revenue: totalRevenue,
        total_purchases: purchases.length,
        active_spotlights: activeSpotlights,
        expired_spotlights: expiredSpotlights,
      },
      revenue_over_time: revenueOverTime,
      purchases,
    });
  } catch (err) {
    console.error("Admin revenue summary error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
