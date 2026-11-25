import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/**
 * GET /api/projects/random
 *
 * Returns the slug of a random approved or featured project.
 *
 * Query params:
 *   ?exclude – comma-separated slugs that must not be returned, so repeated
 *               requests (e.g. "Surprise me" clicks) land on a different
 *               project whenever another candidate exists.
 *
 * Response:
 *   { slug: string }
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const excluded = new Set(
      (url.searchParams.get("exclude") ?? "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    );

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("slug")
      .in("status", ["approved", "featured"]);
    if (error) throw error;

    const slugs = (data ?? [])
      .map((row) => (typeof row.slug === "string" ? row.slug.trim() : ""))
      .filter(Boolean);

    if (slugs.length === 0) {
      return Response.json(
        { error: "No approved projects available" },
        { status: 404 },
      );
    }

    const candidates = slugs.filter((slug) => !excluded.has(slug));
    // When every project is excluded (for example, only one exists), fall back
    // to the full set rather than failing the request.
    const pool = candidates.length > 0 ? candidates : slugs;
    const slug = pool[Math.floor(Math.random() * pool.length)];

    return Response.json({ slug }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Random project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
