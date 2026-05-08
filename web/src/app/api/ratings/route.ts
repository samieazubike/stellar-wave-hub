import { projectsCol, ratingsCol, nextId } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { project_id, score, purpose_score, innovation_score, usability_score, review_text, tx_hash } =
      await request.json();

    if (!project_id || !score || score < 1 || score > 5) {
      return Response.json({ error: "project_id and score (1-5) are required" }, { status: 400 });
    }

    const pDoc = await projectsCol.ref.doc(String(project_id)).get();
    if (!pDoc.exists) return Response.json({ error: "Project not found" }, { status: 404 });
    if (pDoc.data()!.user_id === auth.userId) {
      return Response.json({ error: "Cannot rate your own project" }, { status: 400 });
    }

    // Check for existing rating (upsert)
    const existing = await ratingsCol.ref
      .where("project_id", "==", project_id)
      .where("user_id", "==", auth.userId)
      .limit(1)
      .get();

    const ratingData = {
      project_id,
      user_id: auth.userId,
      score,
      purpose_score: purpose_score || null,
      innovation_score: innovation_score || null,
      usability_score: usability_score || null,
      review_text: review_text || null,
      tx_hash: tx_hash || null,
      created_at: new Date().toISOString(),
    };

    if (!existing.empty) {
      // Update existing rating
      await existing.docs[0].ref.update(ratingData);
    } else {
      // Create new rating
      const numericId = await nextId("ratings");
      await ratingsCol.ref.doc(String(numericId)).set({ numericId, ...ratingData });
    }

    return Response.json({ message: "Rating saved" }, { status: 201 });
  } catch (err) {
    console.error("Rating error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
