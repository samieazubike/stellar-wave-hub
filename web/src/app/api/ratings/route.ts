import { projectsCol, ratingsCol, nextId } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { createRatingSchema } from "@/lib/validation/schemas/ratings";
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

// Rate limit: 30 ratings per hour per user (falls back to IP when anonymous)
const RATING_RATE_LIMIT = { limit: 30, windowMs: 60 * 60_000 };

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  const rateLimitKey = auth
    ? `ratings:user:${auth.userId}`
    : `ratings:ip:${getClientIp(request)}`;
  const rl = checkRateLimit(rateLimitKey, RATING_RATE_LIMIT);
  if (!rl.allowed) return rateLimitExceededResponse(rl.retryAfterSeconds);

  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJsonBody(request, createRatingSchema);
  if (!parsed.success) return parsed.response;

  const {
    project_id,
    score,
    purpose_score,
    innovation_score,
    usability_score,
    review_text,
    tx_hash,
  } = parsed.data;

  try {

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
      owner_reply: null,
      owner_reply_at: null,
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
