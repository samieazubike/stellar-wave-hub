import { getAuthUser } from "@/lib/auth";
import { projectsCol } from "@/lib/db";
import { computeFeaturedUntil, featuredDestination, featuredPriceXlm, getFeaturedMemoForProject, verifySpotlightPayment } from "@/lib/featuredService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId, txHash } = body as { projectId: number; txHash: string };

    if (!projectId || !txHash) {
      return Response.json({ error: "projectId and txHash are required" }, { status: 400 });
    }

    // Project lookup + authz: owner OR admin
    const projDoc = await projectsCol.ref.doc(String(projectId)).get();
    if (!projDoc.exists) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const proj = projDoc.data()!;
    if (proj.user_id !== auth.userId && auth.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent redemption reuse
    if (proj.featured_tx_hash && proj.featured_tx_hash === txHash) {
      // Already activated with this tx hash
      return Response.json({
        ok: true,
        featured: proj.featured,
        featured_until: proj.featured_until,
      });
    }

    // Verify payment on-chain
    await verifySpotlightPayment({ txHash, projectId });

    const now = new Date();
    const featured_until = computeFeaturedUntil(now);

    // Extra safety: ensure memo matches expected pattern on server verification.
    // (verifySpotlightPayment already validates memo text -> projectId)

    await projectsCol.ref.doc(String(projectId)).update({
      featured: 1,
      featured_until,
      featured_tx_hash: txHash,
      updated_at: now.toISOString(),
    });

    return Response.json({ ok: true, featured: 1, featured_until, destination: featuredDestination, price_xlm: featuredPriceXlm, memo: getFeaturedMemoForProject(projectId) });
  } catch (err: unknown) {

    console.error("Featured activate error", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 400 });

  }
}

