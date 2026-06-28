import { Horizon } from "@stellar/stellar-sdk";
import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const server = new Horizon.Server(process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org");

async function getPaymentInfoForTransaction(hash: string) {
  try {
    const ops = await server.operations().forTransaction(hash).call();
    const nativePayments = ops.records.filter((r: any) => r.type === "payment" && r.asset_type === "native");
    if (nativePayments.length > 0) {
      const amount = nativePayments.reduce((sum: number, op: any) => sum + parseFloat(op.amount || "0"), 0);
      const createdAt = nativePayments[0].created_at || null;
      return { amount, createdAt };
    }

    const tx = await server.transactions().transaction(hash).call();
    return { amount: 0, createdAt: tx.created_at ?? null };
  } catch (err) {
    console.error("Revenue transaction lookup failed", hash, err);
    return { amount: 0, createdAt: null };
  }
}

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await projectsCol.ref.get();
    const spotlightProjects = snap.docs
      .map((doc) => ({ id: doc.data().numericId, ...doc.data() }))
      .filter((project) => !!project.featured_tx_hash);

    const payments = await Promise.all(
      spotlightProjects.map(async (project) => {
        const hash = String(project.featured_tx_hash);
        const { amount, createdAt } = await getPaymentInfoForTransaction(hash);
        return {
          id: `${project.id}-${hash}`,
          project_id: project.id,
          project_name: project.name || null,
          status: project.status || null,
          is_active: project.status === "featured",
          transaction_hash: hash,
          amount: Number(amount.toFixed(7)),
          created_at: createdAt,
          stellar_expert_url: `https://stellar.expert/explorer/public/tx/${hash}`,
        };
      }),
    );

    const totalXlm = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const activeSpotlights = payments.filter((payment) => payment.is_active).length;
    const expiredSpotlights = payments.filter((payment) => !payment.is_active).length;

    const timelineMap = payments.reduce((map, payment) => {
      const date = payment.created_at ? new Date(payment.created_at) : null;
      const month = date ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}` : "unknown";
      map[month] = (map[month] || 0) + payment.amount;
      return map;
    }, {} as Record<string, number>);

    const timeline = Object.entries(timelineMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return Response.json({
      totalXlm,
      activeSpotlights,
      expiredSpotlights,
      payments,
      timeline,
    });
  } catch (err) {
    console.error("Admin revenue error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
