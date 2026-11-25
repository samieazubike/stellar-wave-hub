import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

function getExplorerTxUrl(txHash: string, network: string = "mainnet"): string {
  const base =
    network === "testnet"
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";
  return `${base}/tx/${txHash}`;
}

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Query user's payments from the payments ledger
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (paymentsError) {
      throw paymentsError;
    }

    const rows = paymentsData || [];
    const projectIds = Array.from(
      new Set(
        rows
          .map((r) => Number(r.project_id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );

    // Fetch project metadata for projects associated with these payments
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

    const payments = rows.map((row) => {
      const projectId = Number(row.project_id);
      const proj = projectMap.get(projectId);
      const network = row.network || "mainnet";

      return {
        id: Number(row.id),
        tx_hash: row.tx_hash,
        product: row.product,
        project_id: projectId,
        project_name: proj?.name || `Project #${projectId}`,
        project_slug: proj?.slug || null,
        amount: Number(row.amount),
        duration_days: row.duration_days,
        source_address: row.source_address,
        destination_address: row.destination_address,
        network,
        receipt_url: getExplorerTxUrl(row.tx_hash, network),
        created_at: row.created_at,
      };
    });

    return Response.json({ payments });
  } catch (err) {
    console.error("Fetch user payments error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
