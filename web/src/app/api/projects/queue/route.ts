import { projectsCol, usersCol } from "@/lib/db";
import { isClaimActive } from "@/lib/claims";
export const dynamic = "force-dynamic";

async function getUsername(uid: number, cache: Map<number, string>) {
  if (!uid) return null;
  if (!cache.has(uid)) {
    const uDoc = await usersCol.ref.doc(String(uid)).get();
    cache.set(uid, uDoc.exists ? (uDoc.data()!.username as string) : "unknown");
  }
  return cache.get(uid) ?? null;
}

export async function GET() {
  try {
    const snap = await projectsCol.ref
      .where("status", "==", "submitted")
      .get();

    const userCache = new Map<number, string>();
    const projects = await Promise.all(
      snap.docs.map(async (d) => {
        const p = d.data();
        const uid = p.user_id as number;
        const username = await getUsername(uid, userCache);
        // Expired claims are treated as released and hidden from the queue.
        const claimActive = isClaimActive(p);
        const claimedBy = claimActive ? Number(p.claimed_by) : null;
        const claimerUsername = claimedBy ? await getUsername(claimedBy, userCache) : null;
        return {
          id: p.numericId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          tags: p.tags || "",
          stellar_network: p.stellar_network || "mainnet",
          github_url: p.github_url,
          github_repos: p.github_repos || [],
          username,
          created_at: p.created_at,
          claimed_by: claimedBy,
          claimed_by_username: claimerUsername,
          claimed_at: claimActive ? p.claimed_at : null,
        };
      }),
    );

    projects.sort(
      (a, b) => ((b.created_at as string) > (a.created_at as string) ? 1 : -1),
    );

    return Response.json({ projects, total: projects.length });
  } catch (err) {
    console.error("Queue error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

