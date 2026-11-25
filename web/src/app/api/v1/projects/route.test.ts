import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyKey, approvedProjects, latestSnapshot } = vi.hoisted(() => ({
  verifyKey: vi.fn(),
  approvedProjects: vi.fn(),
  latestSnapshot: vi.fn(),
}));
vi.mock("@/lib/api-keys", () => ({ verifyApiKey: verifyKey }));
vi.mock("@/lib/public-api-projects", () => ({
  getApprovedProjects: approvedProjects,
  getLatestFinancialSnapshot: latestSnapshot,
  publicApiCorsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
  },
}));

import { GET as listProjects, OPTIONS as listOptions } from "./route";
import { GET as getProject } from "./[slug]/route";

const projects = [
  { id: 1, slug: "first", name: "First", description: "Wallet", category: "defi", tags: ["payments"], created_at: "2026-11-01", rating: { average: 4, count: 2 } },
  { id: 2, slug: "second", name: "Second", description: "Tools", category: "tooling", tags: [], created_at: "2026-11-20", rating: { average: null, count: 0 } },
];

beforeEach(() => {
  vi.clearAllMocks();
  verifyKey.mockResolvedValue(true);
  approvedProjects.mockResolvedValue(projects);
  latestSnapshot.mockResolvedValue({ captured_at: "2026-11-25", summary: { balances: [] } });
});

describe("public projects API", () => {
  it("rejects requests without a valid key and sends CORS headers", async () => {
    verifyKey.mockResolvedValue(false);
    const response = await listProjects(new Request("http://localhost/api/v1/projects"));
    expect(response.status).toBe(401);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(approvedProjects).not.toHaveBeenCalled();
    expect((await listOptions()).status).toBe(204);
  });

  it("filters, sorts, and paginates the stable list", async () => {
    const response = await listProjects(new Request("http://localhost/api/v1/projects?sort=top-rated&page=1&limit=1"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ projects: [{ slug: "first" }], pagination: { page: 1, limit: 1, total: 2, pages: 2 } });
    const filtered = await listProjects(new Request("http://localhost/api/v1/projects?category=tooling&search=tools"));
    expect((await filtered.json()).projects).toMatchObject([{ slug: "second" }]);
  });

  it("returns 404 for unknown slugs and adds a requested financial snapshot", async () => {
    const missing = await getProject(new Request("http://localhost/api/v1/projects/missing"), { params: Promise.resolve({ slug: "missing" }) });
    expect(missing.status).toBe(404);
    const found = await getProject(new Request("http://localhost/api/v1/projects/first?include=financials"), { params: Promise.resolve({ slug: "first" }) });
    expect(await found.json()).toMatchObject({ project: { slug: "first" }, financials: { captured_at: "2026-11-25" } });
    expect(latestSnapshot).toHaveBeenCalledWith(1);
  });
});
