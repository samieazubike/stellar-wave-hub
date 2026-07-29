import { ratingVotesCol, nextId } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { rating_id?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rating_id } = body;
  if (!rating_id || typeof rating_id !== "number") {
    return Response.json({ error: "rating_id is required" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Check if vote already exists
    const { data: existing } = await supabase
      .from("rating_votes")
      .select("numericId")
      .eq("rating_id", rating_id)
      .eq("user_id", auth.userId)
      .maybeSingle();

    let voted: boolean;

    if (existing) {
      // Remove vote
      await supabase
        .from("rating_votes")
        .delete()
        .eq("numericId", existing.numericId);
      voted = false;
    } else {
      // Add vote
      const numericId = await nextId("rating_votes");
      await ratingVotesCol.ref.doc(String(numericId)).set({
        numericId,
        rating_id,
        user_id: auth.userId,
        created_at: new Date().toISOString(),
      });
      voted = true;
    }

    // Get updated count
    const { count } = await supabase
      .from("rating_votes")
      .select("*", { count: "exact", head: true })
      .eq("rating_id", rating_id);

    return Response.json({ voted, helpful_count: count ?? 0 });
  } catch (err) {
    console.error("Rating vote error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const ratingIdsParam = url.searchParams.get("rating_ids");
  if (!ratingIdsParam) {
    return Response.json({ votes: {} });
  }

  const ratingIds = ratingIdsParam
    .split(",")
    .map(Number)
    .filter((id) => !isNaN(id));

  if (ratingIds.length === 0) {
    return Response.json({ votes: {} });
  }

  try {
    const supabase = getSupabase();
    const { data: userVotes } = await supabase
      .from("rating_votes")
      .select("rating_id")
      .in("rating_id", ratingIds)
      .eq("user_id", auth.userId);

    const votes: Record<number, boolean> = {};
    for (const v of userVotes ?? []) {
      votes[Number(v.rating_id)] = true;
    }

    return Response.json({ votes });
  } catch (err) {
    console.error("Rating votes fetch error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
