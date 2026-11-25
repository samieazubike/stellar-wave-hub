import { verifyApiKey } from "@/lib/api-keys";
import { getApprovedProjects, publicApiCorsHeaders } from "@/lib/public-api-projects";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: publicApiCorsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: publicApiCorsHeaders });
}

export async function GET(request: Request) {
  try {
    if (!await verifyApiKey(request)) return json({ error: "Invalid API key" }, 401);
    const params = new URL(request.url).searchParams;
    const pageText = params.get("page") || "1";
    const limitText = params.get("limit") || "20";
    const sort = params.get("sort") || "newest";
    if (!/^[1-9]\d*$/.test(pageText) || !/^[1-9]\d*$/.test(limitText) ||
      !Number.isSafeInteger(Number(pageText)) || Number(limitText) > 100 ||
      !["newest", "top-rated", "most-reviewed"].includes(sort)) {
      return json({ error: "Invalid page, limit, or sort" }, 400);
    }
    const page = Number(pageText);
    const limit = Number(limitText);
    const category = params.get("category")?.trim().toLowerCase() || "";
    const search = params.get("search")?.trim().toLowerCase() || "";
    if (category.length > 80 || search.length > 200) {
      return json({ error: "Filter is too long" }, 400);
    }

    const projects = (await getApprovedProjects())
      .filter((project) => !category || project.category.toLowerCase() === category)
      .filter((project) => !search || [project.name, project.description, ...project.tags]
        .some((value) => value.toLowerCase().includes(search)));
    projects.sort((a, b) => {
      if (sort === "top-rated") {
        const difference = (b.rating.average ?? -1) - (a.rating.average ?? -1);
        if (difference) return difference;
      } else if (sort === "most-reviewed") {
        const difference = b.rating.count - a.rating.count;
        if (difference) return difference;
      }
      return b.created_at.localeCompare(a.created_at) || a.id - b.id;
    });
    const total = projects.length;
    return json({
      projects: projects.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Public projects API error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
