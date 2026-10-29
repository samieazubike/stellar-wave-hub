import { ratingsCol, ratingVotesCol, nextId } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/ratings/[id]/vote
 * Adds a helpful vote to a rating.
 * A user can vote at most once per review (enforced by DB unique index + existence check).
 * Prevents voting on one's own review.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ratingId = Number(id);
  if (!ratingId || Number.isNaN(ratingId)) {
    return Response.json({ error: "Invalid rating ID" }, { status: 400 });
  }

  try {
    const ratingDoc = await ratingsCol.ref.doc(String(ratingId)).get();
    if (!ratingDoc.exists) {
      return Response.json({ error: "Rating not found" }, { status: 404 });
    }

    const ratingData = ratingDoc.data()!;
    if (ratingData.user_id === auth.userId) {
      return Response.json(
        { error: "Cannot vote on your own review" },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existing = await ratingVotesCol.ref
      .where("rating_id", "==", ratingId)
      .where("user_id", "==", auth.userId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return Response.json(
        { error: "You have already marked this review as helpful", voted: true },
        { status: 409 }
      );
    }

    const numericId = await nextId("rating_votes");
    await ratingVotesCol.ref.doc(String(numericId)).set({
      numericId,
      rating_id: ratingId,
      user_id: auth.userId,
      created_at: new Date().toISOString(),
    });

    // Count updated helpful votes
    const votesSnap = await ratingVotesCol.ref
      .where("rating_id", "==", ratingId)
      .get();
    const helpful_count = votesSnap.docs.length;

    return Response.json(
      {
        message: "Vote added successfully",
        helpful_count,
        has_voted: true,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Catch unique constraint violation in case of race conditions
    const errorObj = err as { code?: string; message?: string };
    if (errorObj?.code === "23505") {
      return Response.json(
        { error: "You have already marked this review as helpful", voted: true },
        { status: 409 }
      );
    }
    console.error("Error adding rating vote:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/ratings/[id]/vote
 * Removes a user's helpful vote from a review.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ratingId = Number(id);
  if (!ratingId || Number.isNaN(ratingId)) {
    return Response.json({ error: "Invalid rating ID" }, { status: 400 });
  }

  try {
    const existing = await ratingVotesCol.ref
      .where("rating_id", "==", ratingId)
      .where("user_id", "==", auth.userId)
      .limit(1)
      .get();

    if (existing.empty) {
      return Response.json(
        { error: "Vote not found" },
        { status: 404 }
      );
    }

    await existing.docs[0].ref.delete();

    // Count remaining helpful votes
    const votesSnap = await ratingVotesCol.ref
      .where("rating_id", "==", ratingId)
      .get();
    const helpful_count = votesSnap.docs.length;

    return Response.json(
      {
        message: "Vote removed successfully",
        helpful_count,
        has_voted: false,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error removing rating vote:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
