import { verifyApiKey } from "@/lib/api-keys";
import { getApprovedProjects, getLatestFinancialSnapshot, publicApiCorsHeaders } from "@/lib/public-api-projects";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: publicApiCorsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: publicApiCorsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    if (!await verifyApiKey(request)) return json({ error: "Invalid API key" }, 401);
    const { slug } = await params;
    const include = new URL(request.url).searchParams.get("include");
    if (include && include !== "financials") return json({ error: "Invalid include value" }, 400);
    const project = (await getApprovedProjects()).find((item) => item.slug === slug);
    if (!project) return json({ error: "Project not found" }, 404);
    if (include === "financials") {
      const financials = await getLatestFinancialSnapshot(project.id);
      return json({ project, financials });
    }
    return json({ project });
  } catch (error) {
    console.error("Public project API error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
