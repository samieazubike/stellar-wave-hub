import { nextId, ratingVotesCol } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const auth = await verifyAuth(request);

    const ratingId = Number(id);
    const userId = auth.user.id;

    const existing = await ratingVotesCol.ref
        .where("rating_id", "==", ratingId)
        .where("user_id", "==", userId)
        .get();

    if (!existing.empty) {
        return Response.json({ success: true });
    }

    const voteId = await nextId("rating_votes");

    await ratingVotesCol.ref.doc(String(voteId)).set({
        numericId: voteId,
        rating_id: ratingId,
        user_id: userId,
        created_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const auth = await verifyAuth(request);

    const ratingId = Number(id);
    const userId = auth.user.id;

    const existing = await ratingVotesCol.ref
        .where("rating_id", "==", ratingId)
        .where("user_id", "==", userId)
        .get();

    if (!existing.empty) {
        await Promise.all(
            existing.docs.map((d) => d.ref.delete())
        );
    }

    return Response.json({ success: true });
}
