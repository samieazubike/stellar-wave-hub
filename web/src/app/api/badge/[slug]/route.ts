import { projectsCol, ratingsCol } from "@/lib/db";
import { ratingBadge, renderBadge } from "@/lib/badge";

export const dynamic = "force-dynamic";

const OK_CACHE = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";

function svgResponse(value: string, color: string, status: number, cache: string) {
  return new Response(renderBadge(value, color), {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params;
  // Accept both /api/badge/my-project and /api/badge/my-project.svg
  const slug = raw.replace(/\.svg$/i, "");

  if (!/^[a-z0-9_-]{1,100}$/i.test(slug)) {
    return svgResponse("not found", "#9f9f9f", 404, "public, max-age=60");
  }

  try {
    const snap = await projectsCol.ref.where("slug", "==", slug).limit(1).get();
    if (snap.empty) {
      return svgResponse("not found", "#9f9f9f", 404, "public, max-age=60");
    }

    const project = snap.docs[0].data();
    // Only listed projects get a public badge.
    if (project.status !== "approved" && project.status !== "featured") {
      return svgResponse("not found", "#9f9f9f", 404, "public, max-age=60");
    }
    const projectId = project.numericId;
    const rSnap = await ratingsCol.ref.where("project_id", "==", projectId).get();
    const scores = rSnap.docs
      .map((d) => Number(d.data().score))
      .filter((n) => Number.isFinite(n));

    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const { value, color } = ratingBadge(avg);
    return svgResponse(value, color, 200, OK_CACHE);
  } catch (err) {
    console.error("Badge error:", err);
    return svgResponse("unavailable", "#9f9f9f", 500, "no-store");
  }
}
