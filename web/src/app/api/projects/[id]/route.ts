import { projectsCol, usersCol, ratingsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isPublicProjectStatus, normalizeProjectStatus } from "@/lib/projects";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = getAuthUser(_request);

  // Lookup by numeric ID or slug
  const isNumeric = /^\d+$/.test(id);
  let projectData: Record<string, unknown> | null = null;

  if (isNumeric) {
    const doc = await projectsCol.ref.doc(id).get();
    if (doc.exists) projectData = { ...doc.data()!, id: doc.data()!.numericId };
  } else {
    const snap = await projectsCol.ref.where("slug", "==", id).limit(1).get();
    if (!snap.empty) {
      const d = snap.docs[0].data();
      projectData = { ...d, id: d.numericId };
    }
  }

  if (!projectData) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const normalizedStatus = normalizeProjectStatus(projectData.status);
  const canViewPrivateProject =
    isPublicProjectStatus(normalizedStatus) ||
    (auth &&
      ((projectData.user_id as number) === auth.userId || auth.role === "admin"));

  if (!canViewPrivateProject) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  projectData.status = normalizedStatus;

  // Fetch user info
  const uid = projectData.user_id as number;
  if (uid) {
    const uDoc = await usersCol.ref.doc(String(uid)).get();
    if (uDoc.exists) {
      projectData.username = uDoc.data()!.username;
      projectData.user_github = uDoc.data()!.github_url;
    }
  }

  // Fetch ratings
  const rSnap = await ratingsCol.ref
    .where("project_id", "==", projectData.id)
    .orderBy("created_at", "desc")
    .get();

  const ratings: Record<string, unknown>[] = await Promise.all(
    rSnap.docs.map(async (d) => {
      const r = d.data();
      let username = "unknown";
      if (r.user_id) {
        const u = await usersCol.ref.doc(String(r.user_id)).get();
        if (u.exists) username = u.data()!.username;
      }
      return { ...r, id: r.numericId ?? d.id, username };
    })
  );

  // Compute averages
  const scores = ratings.map((r) => r.score as number);
  const purposeScores = ratings.map((r) => r.purpose_score as number).filter(Boolean);
  const innovationScores = ratings.map((r) => r.innovation_score as number).filter(Boolean);
  const usabilityScores = ratings.map((r) => r.usability_score as number).filter(Boolean);
  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  const averages = {
    avg_score: avg(scores),
    avg_purpose: avg(purposeScores),
    avg_innovation: avg(innovationScores),
    avg_usability: avg(usabilityScores),
    total: ratings.length,
  };

  return Response.json({ project: projectData, ratings, averages });
}
