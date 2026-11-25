import {getSupabase} from "@/lib/firebase";
import {ratingsCol} from "@/lib/db";

export const dynamic = "force-dynamic";
// Cache for 5 minutes
export const revalidate = 300;

export async function GET() {
	try {
		const supabase = getSupabase();

		// Count approved/featured projects
		const {count: projectCount, error: projectError} = await supabase
			.from("projects")
			.select("*", {count: "exact", head: true})
			.in("status", ["approved", "featured"]);

		if (projectError) throw projectError;

		// Count total ratings (reviews)
		const ratingsSnap = await ratingsCol.ref.get();
		const reviewCount = ratingsSnap.size;

		// Count unique contributors (users who have submitted approved/featured projects)
		const {data: contributorData, error: contributorError} = await supabase
			.from("projects")
			.select("user_id")
			.in("status", ["approved", "featured"]);

		if (contributorError) throw contributorError;

		const uniqueContributors = new Set(
			(contributorData || []).map((p) => p.user_id).filter(Boolean)
		);
		const contributorCount = uniqueContributors.size;

		return Response.json(
			{
				projects: projectCount || 0,
				reviews: reviewCount,
				contributors: contributorCount,
			},
			{
				headers: {
					"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
				},
			}
		);
	} catch (err) {
		console.error("Stats API error:", err);
		return Response.json({error: "Internal server error"}, {status: 500});
	}
}
