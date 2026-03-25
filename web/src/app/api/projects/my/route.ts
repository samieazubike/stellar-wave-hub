import { projectsCol, ratingsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

type ProjectRow = {
  numericId: number;
};

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await projectsCol.ref
    .where("user_id", "==", auth.userId)
    .orderBy("created_at", "desc")
    .get();

  const ratingsSnap = await ratingsCol.ref.get();
  const ratingsByProject = new Map<number, number[]>();
  ratingsSnap.docs.forEach((d) => {
    const r = d.data();
    const pid = r.project_id as number;
    if (!ratingsByProject.has(pid)) ratingsByProject.set(pid, []);
    ratingsByProject.get(pid)!.push(r.score as number);
  });

  const projects = snap.docs.map((d) => {
    const p = d.data() as ProjectRow & Record<string, unknown>;
    const scores = ratingsByProject.get(p.numericId) || [];
    return {
      ...p,
      id: p.numericId,
      avg_rating: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      rating_count: scores.length,
    };
  });

  return Response.json({ projects });
}
