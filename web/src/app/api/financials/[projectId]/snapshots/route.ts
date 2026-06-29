import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/** Shape stored inside snapshot_data by the cron job */
interface SnapshotData {
  balances?: Array<{
    asset_type: string;
    asset_code?: string;
    balance: string;
  }>;
}

/** Extracts the native XLM balance from a snapshot_data record */
function xlmBalance(snapshotData: SnapshotData): number {
  const xlm = (snapshotData.balances ?? []).find(
    (b) => b.asset_type === "native",
  );
  return xlm ? parseFloat(xlm.balance) : 0;
}

/**
 * GET /api/financials/[projectId]/snapshots
 *
 * Returns up to 30 daily snapshots for the given numeric project id,
 * oldest first — ready to feed straight into the Sparkline component.
 *
 * Response:
 *   { snapshots: Array<{ created_at: string; xlm_balance: number }> }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const numericId = Number(projectId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("financial_snapshots")
    .select("created_at, snapshot_data")
    .eq("project_id", numericId)
    .order("created_at", { ascending: true })
    .limit(30);

  if (error) {
    console.error("Snapshots fetch error:", error);
    return Response.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 },
    );
  }

  const snapshots = (data ?? []).map((row) => ({
    created_at: row.created_at as string,
    xlm_balance: xlmBalance(row.snapshot_data as SnapshotData),
  }));

  return Response.json({ snapshots });
}
