import { projectsCol, usersCol } from "@/lib/db";
export const dynamic = "force-dynamic";

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
        if (uid && !userCache.has(uid)) {
          const uDoc = await usersCol.ref.doc(String(uid)).get();
          userCache.set(uid, uDoc.exists ? (uDoc.data()!.username as string) : "unknown");
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
