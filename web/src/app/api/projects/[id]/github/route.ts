import { projectsCol } from "@/lib/db";
import { parseGithubRepo } from "@/lib/github";
export const dynamic = "force-dynamic";

const CACHE_SECONDS = 60 * 60;
const GITHUB_TIMEOUT_MS = 5_000;

// GET /api/projects/[id]/github — repo stats for the project's GitHub URL, cached for 1 hour.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await projectsCol.ref.doc(id).get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });

  const project = doc.data()!;
  const repos = Array.isArray(project.github_repos) ? project.github_repos : [];
  const repo =
    parseGithubRepo(project.github_url) ??
    repos.map((r: { url?: string }) => parseGithubRepo(r?.url)).find(Boolean) ??
    null;
  if (!repo) return Response.json({ error: "No GitHub repository" }, { status: 404 });

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS },
    });
    // Rate limits, private repos and missing repos all just hide the card.
    if (!res.ok) return Response.json({ error: "GitHub unavailable" }, { status: 502 });

    const data = await res.json();
    return Response.json(
      {
        stars: Number(data.stargazers_count ?? 0),
        forks: Number(data.forks_count ?? 0),
        openIssues: Number(data.open_issues_count ?? 0),
        lastCommit: typeof data.pushed_at === "string" ? data.pushed_at : null,
        license: data.license?.spdx_id && data.license.spdx_id !== "NOASSERTION" ? data.license.spdx_id : data.license?.name ?? null,
      },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}` } },
    );
  } catch {
    return Response.json({ error: "GitHub unavailable" }, { status: 502 });
  }
}
