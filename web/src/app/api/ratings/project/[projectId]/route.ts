import { ratingsCol, usersCol, ratingVotesCol } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;

    let currentUserId: number | null = null;

    try {
        const auth = await verifyAuth(request);
        currentUserId = auth.user.id;
    } catch {}

    const snap = await ratingsCol.ref
        .where("project_id", "==", Number(projectId))
        .orderBy("created_at", "desc")
        .get();

    const ratings = await Promise.all(
        snap.docs.map(async (doc) => {
            const rating = doc.data();

            let username = "unknown";

            if (rating.user_id) {
                const user = await usersCol.ref
                    .doc(String(rating.user_id))
                    .get();

                if (user.exists) {
                    username = user.data()!.username;
                }
            }

            const votes = await ratingVotesCol.ref
                .where("rating_id", "==", rating.numericId)
                .get();

            const helpfulCount = votes.docs.length;

            const hasVoted =
                currentUserId !== null &&
                votes.docs.some(
                    (v) => v.data().user_id === currentUserId
                );

            return {
                ...rating,
                id: rating.numericId,
                username,
                helpfulCount,
                hasVoted,
            };
        })
    );

    return Response.json({ ratings });
}