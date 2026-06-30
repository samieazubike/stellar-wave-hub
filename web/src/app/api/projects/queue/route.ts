import { projectsCol, usersCol } from "@/lib/db";
import { isClaimStale } from "@/lib/claims";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await projectsCol.ref
      .where("status", "==", "submitted")
      .get();

    const supabase = getSupabase();
    const now = new Date().toISOString();

    const userCache = new Map<number, string>();
    const projects = await Promise.all(
      snap.docs.map(async (d) => {
        const p = d.data();

        const claimed_by = p.claimed_by as number | null;
        const claimed_at = p.claimed_at as string | null;

        if (claimed_by && claimed_at && isClaimStale(claimed_at)) {
          await supabase
            .from("projects")
            .update({ claimed_by: null, claimed_at: null })
            .eq("numericId", p.numericId as number);
          (p as any).claimed_by = null;
          (p as any).claimed_at = null;
        }

        const uid = p.user_id as number;
        if (uid && !userCache.has(uid)) {
          const uDoc = await usersCol.ref.doc(String(uid)).get();
          userCache.set(uid, uDoc.exists ? (uDoc.data()!.username as string) : "unknown");
        }

        let claimed_by_username: string | null = null;
        if (p.claimed_by) {
          if (!userCache.has(p.claimed_by as number)) {
            const uDoc = await usersCol.ref.doc(String(p.claimed_by)).get();
            userCache.set(p.claimed_by as number, uDoc.exists ? (uDoc.data()!.username as string) : "unknown");
          }
          claimed_by_username = userCache.get(p.claimed_by as number)!;
        }

        return {
          id: p.numericId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          stellar_network: p.stellar_network || "mainnet",
          github_url: p.github_url,
          github_repos: p.github_repos || [],
          username: uid ? userCache.get(uid) : null,
          claimed_by: p.claimed_by as number | null,
          claimed_by_username,
          claimed_at: p.claimed_at as string | null,
          created_at: p.created_at,
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
