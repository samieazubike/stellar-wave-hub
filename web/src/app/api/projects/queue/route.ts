import { projectsCol, usersCol } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await projectsCol.ref
      .where("status", "==", "submitted")
      .get();

    const now = new Date().toISOString();
    const userCache = new Map<number, string>();
    const projects = await Promise.all(
      snap.docs.map(async (d) => {
        const p = d.data();
        const uid = p.user_id as number;
        if (uid && !userCache.has(uid)) {
          const uDoc = await usersCol.ref.doc(String(uid)).get();
          userCache.set(uid, uDoc.exists ? (uDoc.data()!.username as string) : "unknown");
        }
        const priorityUntil = (p.priority_until as string) || null;
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
          priority_until: priorityUntil,
          // Convenience flag: true when the priority window is still active
          is_priority: priorityUntil != null && priorityUntil > now,
        };
      }),
    );

    // Sort: active priority items first (newest priority_until first among them),
    // then the rest sorted by created_at descending.
    projects.sort((a, b) => {
      const aPriority = a.is_priority ? 1 : 0;
      const bPriority = b.is_priority ? 1 : 0;
      if (bPriority !== aPriority) return bPriority - aPriority;
      // Within the same tier sort by created_at descending
      return (b.created_at as string) > (a.created_at as string) ? 1 : -1;
    });

    return Response.json({ projects, total: projects.length });
  } catch (err) {
    console.error("Queue error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
