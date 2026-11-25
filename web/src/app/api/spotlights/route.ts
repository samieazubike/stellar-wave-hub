import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/**
 * GET /api/spotlights
 *
 * Returns active spotlight (featured) projects for the sponsored slot in
 * the Explore page.  A project is considered an active spotlight when:
 *   • featured = 1
 *   • status   = 'featured'
 *   • featured_expires_at is NULL **or** has not yet passed
 *
 * Query params:
 *   ?category   – only return spotlights that match this category (optional)
 *   ?exclude    – comma-separated numeric project IDs already on the current
 *                 page; those will be omitted so the sponsored card is never
 *                 a duplicate of an organic result
 *
 * Response:
 *   { spotlights: Project[] }   — ordered randomly, caller picks [0]
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category")?.trim().toLowerCase();
    const excludeParam = url.searchParams.get("exclude") ?? "";

    const excludeIds: number[] = excludeParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    const supabase = getSupabase();
    const now = new Date().toISOString();

    let query = supabase
      .from("projects")
      .select("*")
      .eq("featured", 1)
      .eq("status", "featured")
      .or(`featured_expires_at.is.null,featured_expires_at.gt.${now}`);

    if (category) {
      query = query.ilike("category", category);
    }

    if (excludeIds.length > 0) {
      query = query.not("numericId", "in", `(${excludeIds.join(",")})`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Shuffle server-side so each call returns a different candidate first
    const rows = (data ?? []).map((row) => ({ ...row, id: row.numericId }));
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }

    return Response.json({ spotlights: rows });
  } catch (err) {
    console.error("Spotlights error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
