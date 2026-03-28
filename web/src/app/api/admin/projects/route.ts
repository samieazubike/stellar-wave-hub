import { projectsCol, usersCol, ratingsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status"); // "approved", "featured", "submitted", "rejected", or null for all
    const search = url.searchParams.get("search")?.toLowerCase();

    let snap;
    if (status) {
      snap = await projectsCol.ref.where("status", "==", status).get();
    } else {
      snap = await projectsCol.ref.get();
    }

    let projects: Record<string, unknown>[] = snap.docs.map((d) => ({
      ...d.data(),
      id: d.data().numericId,
    }));

    if (search) {
      projects = projects.filter(
        (p) =>
          (p.name as string)?.toLowerCase().includes(search) ||
          (p.description as string)?.toLowerCase().includes(search) ||
          (p.tags as string)?.toLowerCase().includes(search),
      );
    }

    // Fetch ratings
    const ratingsSnap = await ratingsCol.ref.get();
    const ratingsByProject = new Map<number, number[]>();
    ratingsSnap.docs.forEach((d) => {
      const r = d.data();
      const pid = r.project_id as number;
      if (!ratingsByProject.has(pid)) ratingsByProject.set(pid, []);
      ratingsByProject.get(pid)!.push(r.score as number);
    });

    // Enrich
    const userCache = new Map<number, string>();
    const enriched: Record<string, unknown>[] = await Promise.all(
      projects.map(async (p) => {
        const uid = p.user_id as number;
        if (uid && !userCache.has(uid)) {
          const uDoc = await usersCol.ref.doc(String(uid)).get();
          userCache.set(uid, uDoc.exists ? (uDoc.data()!.username as string) : "unknown");
        }
        const scores = ratingsByProject.get(p.id as number) || [];
        const avg_rating = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        return { ...p, username: uid ? userCache.get(uid) : null, avg_rating, rating_count: scores.length };
      }),
    );

    enriched.sort((a, b) => ((b.created_at as string) > (a.created_at as string) ? 1 : -1));

    return Response.json({ projects: enriched });
  } catch (err) {
    console.error("Admin list projects error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
