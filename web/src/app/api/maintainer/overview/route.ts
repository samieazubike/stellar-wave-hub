import { projectsCol, usersCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ProjectRow = Record<string, unknown> & {
  numericId: number;
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  featured: number;
  user_id: number;
  stellar_network?: string;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
};

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "maintainer")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await projectsCol.ref.get();

    const all: ProjectRow[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        ...(data as ProjectRow),
        id: data.numericId as number,
        numericId: data.numericId as number,
      } as ProjectRow;
    });

    const pendingCount = all.filter((p) => p.status === "submitted").length;
    const approvedCount = all.filter((p) => p.status === "approved").length;
    const featuredCount = all.filter((p) => p.status === "featured").length;
    const rejectedCount = all.filter((p) => p.status === "rejected").length;
    const delistedCount = all.filter((p) => p.status === "delisted").length;

    // Sort by updated_at (fallback to created_at) descending for recently moderated
    const sortedByUpdated = [...all]
      .filter((p) => p.status !== "submitted")
      .sort((a, b) => {
        const aTime = (a.updated_at as string) || (a.created_at as string) || "";
        const bTime = (b.updated_at as string) || (b.created_at as string) || "";
        return bTime.localeCompare(aTime);
      });

    const recentSlice = sortedByUpdated.slice(0, 8);

    // Enrich recently moderated with username (cache lookups)
    const userCache = new Map<number, string>();
    const recentlyModerated = await Promise.all(
      recentSlice.map(async (p) => {
        const uid = p.user_id as number;
        let username: string | null = null;
        if (uid) {
          if (userCache.has(uid)) {
            username = userCache.get(uid)!;
          } else {
            try {
              const uDoc = await usersCol.ref.doc(String(uid)).get();
              const name = uDoc.exists ? (uDoc.data()!.username as string) : "unknown";
              userCache.set(uid, name);
              username = name;
            } catch {
              username = "unknown";
            }
          }
        }
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          status: p.status,
          featured: p.featured,
          username,
          stellar_network: p.stellar_network,
          rejection_reason: (p.rejection_reason as string | null) ?? null,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      })
    );

    // Pending preview: most recent 5 pending, sorted by created_at desc
    const pendingSorted = [...all]
      .filter((p) => p.status === "submitted")
      .sort((a, b) => ((b.created_at as string) || "").localeCompare((a.created_at as string) || ""))
      .slice(0, 5);

    const pendingUserCache = new Map<number, string>(userCache);
    const pendingPreview = await Promise.all(
      pendingSorted.map(async (p) => {
        const uid = p.user_id as number;
        let username: string | null = null;
        if (uid) {
          if (pendingUserCache.has(uid)) {
            username = pendingUserCache.get(uid)!;
          } else {
            try {
              const uDoc = await usersCol.ref.doc(String(uid)).get();
              const name = uDoc.exists ? (uDoc.data()!.username as string) : "unknown";
              pendingUserCache.set(uid, name);
              username = name;
            } catch {
              username = "unknown";
            }
          }
        }
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          username,
          created_at: p.created_at,
        };
      })
    );

    return Response.json({
      pending_count: pendingCount,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        featured: featuredCount,
        rejected: rejectedCount,
        delisted: delistedCount,
        total: all.length,
      },
      recently_moderated: recentlyModerated,
      pending_preview: pendingPreview,
    });
  } catch (err) {
    console.error("Maintainer overview error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
