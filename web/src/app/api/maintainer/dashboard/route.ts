import { projectsCol, usersCol } from "@/lib/db";
import { getAuthUser, hasMinRole, getMaintainerCategories } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ProjectRecord {
  numericId?: number;
  id?: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  featured?: number;
  rejection_reason?: string | null;
  stellar_network?: string;
  github_url?: string;
  github_repos?: { label: string; url: string }[];
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "maintainer")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const userRole = auth.role;
    const isFullAdmin = userRole === "admin";
    const userCategories = isFullAdmin ? [] : await getMaintainerCategories(auth.userId);

    const snap = await projectsCol.ref.get();
    const allDocs = snap.docs.map((d) => d.data() as ProjectRecord);

    const userCache = new Map<number, string>();
    const getUsername = async (userId?: number | null): Promise<string | null> => {
      if (!userId) return null;
      if (userCache.has(userId)) return userCache.get(userId)!;
      try {
        const uDoc = await usersCol.ref.doc(String(userId)).get();
        const uname = uDoc.exists && uDoc.data()?.username ? String(uDoc.data()!.username) : "unknown";
        userCache.set(userId, uname);
        return uname;
      } catch {
        return "unknown";
      }
    };

    let totalPending = 0;
    let scopedPending = 0;
    let totalApproved = 0;
    let totalRejected = 0;
    let totalFeatured = 0;

    const pendingList: Array<ProjectRecord & { id: number; in_scope: boolean }> = [];
    const moderatedList: Array<ProjectRecord & { id: number }> = [];

    for (const p of allDocs) {
      const projId = Number(p.numericId ?? p.id ?? 0);
      const status = p.status || "submitted";
      const category = p.category || "other";

      if (status === "submitted") {
        totalPending++;
        const inScope = isFullAdmin || userCategories.includes(category);
        if (inScope) {
          scopedPending++;
        }
        pendingList.push({
          ...p,
          id: projId,
          in_scope: inScope,
        });
      } else if (status === "approved") {
        totalApproved++;
        moderatedList.push({ ...p, id: projId });
      } else if (status === "featured") {
        totalApproved++;
        totalFeatured++;
        moderatedList.push({ ...p, id: projId });
      } else if (status === "rejected" || status === "delisted") {
        totalRejected++;
        moderatedList.push({ ...p, id: projId });
      }
    }

    // Sort pending: in-scope items first, then newest first
    pendingList.sort((a, b) => {
      if (a.in_scope && !b.in_scope) return -1;
      if (!a.in_scope && b.in_scope) return 1;
      return (b.created_at || "") > (a.created_at || "") ? 1 : -1;
    });

    // Sort recently moderated by updated_at or created_at descending
    moderatedList.sort((a, b) => {
      const timeA = a.updated_at || a.created_at || "";
      const timeB = b.updated_at || b.created_at || "";
      return timeB > timeA ? 1 : -1;
    });

    // Enrich top pending projects
    const topPending = await Promise.all(
      pendingList.slice(0, 20).map(async (p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        stellar_network: p.stellar_network || "mainnet",
        github_url: p.github_url,
        github_repos: p.github_repos || [],
        username: await getUsername(p.user_id),
        created_at: p.created_at,
        in_scope: p.in_scope,
      }))
    );

    // Enrich top recently moderated projects
    const recentlyModerated = await Promise.all(
      moderatedList.slice(0, 10).map(async (p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        status: p.status,
        featured: p.featured ?? 0,
        rejection_reason: p.rejection_reason || null,
        created_at: p.created_at,
        updated_at: p.updated_at || p.created_at,
        username: await getUsername(p.user_id),
        can_moderate: isFullAdmin || userCategories.includes(p.category),
      }))
    );

    return Response.json({
      stats: {
        totalPending,
        scopedPending: isFullAdmin ? totalPending : scopedPending,
        totalApproved,
        totalRejected,
        totalFeatured,
        userRole,
        assignedCategories: userCategories,
        isFullAdmin,
      },
      pendingProjects: topPending,
      recentlyModerated,
    });
  } catch (err) {
    console.error("Maintainer dashboard API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
