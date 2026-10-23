import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/**
 * GET /api/sponsors/category/[category]
 * Returns the current active sponsor for the specified category.
 * If no sponsor is currently active, returns { sponsor: null }.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  try {
    const { category: rawCategory } = await params;
    if (!rawCategory || !rawCategory.trim()) {
      return Response.json({ error: "Category is required" }, { status: 400 });
    }

    const category = decodeURIComponent(rawCategory).toLowerCase().trim();
    const db = getSupabase();
    const now = new Date().toISOString();

    const { data: sponsors, error } = await db
      .from("category_sponsors")
      .select("*")
      .eq("category", category)
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("starts_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    const sponsor = sponsors && sponsors.length > 0 ? sponsors[0] : null;

    if (!sponsor) {
      return Response.json({ sponsor: null });
    }

    const { data: project } = await db
      .from("projects")
      .select("*")
      .eq("numericId", sponsor.project_id)
      .maybeSingle();

    return Response.json({
      sponsor: {
        ...sponsor,
        project: project ? { ...project, id: project.numericId } : null,
      },
    });
  } catch (err: any) {
    console.error("GET /api/sponsors/category/[category] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
