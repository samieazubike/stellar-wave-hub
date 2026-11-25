import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, select, inFilter, getSupabase } = vi.hoisted(() => {
  const inFilter = vi.fn();
  const select = vi.fn(() => ({ in: inFilter }));
  const from = vi.fn(() => ({ select }));
  const getSupabase = vi.fn(() => ({ from }));
  return { from, select, inFilter, getSupabase };
});

vi.mock("@/lib/firebase", () => ({ getSupabase }));

import { GET } from "./route";

function request(query = "") {
  return new Request(`http://localhost/api/projects/random${query}`);
}

function mockProjects(rows: Array<Record<string, unknown>>) {
  inFilter.mockResolvedValue({ data: rows, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  inFilter.mockReset();
});

describe("GET /api/projects/random", () => {
  it("queries approved and featured projects and returns a slug", async () => {
    mockProjects([{ slug: "alpha" }, { slug: "beta" }, { slug: "gamma" }]);

    const res = await GET(request());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(["alpha", "beta", "gamma"]).toContain(data.slug);
    expect(from).toHaveBeenCalledWith("projects");
    expect(select).toHaveBeenCalledWith("slug");
    expect(inFilter).toHaveBeenCalledWith("status", ["approved", "featured"]);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("never returns an excluded slug while another candidate exists", async () => {
    mockProjects([{ slug: "alpha" }, { slug: "beta" }]);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const res = await GET(request("?exclude=alpha"));
      const data = await res.json();
      expect(data.slug).toBe("beta");
    }
  });

  it("supports a comma-separated exclude list", async () => {
    mockProjects([{ slug: "alpha" }, { slug: "beta" }, { slug: "gamma" }]);

    const res = await GET(request("?exclude=alpha,beta"));
    const data = await res.json();

    expect(data.slug).toBe("gamma");
  });

  it("falls back to the full set when every project is excluded", async () => {
    mockProjects([{ slug: "only" }]);

    const res = await GET(request("?exclude=only"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.slug).toBe("only");
  });

  it("ignores rows without a usable slug", async () => {
    mockProjects([{ slug: "" }, { slug: null }, {}, { slug: "  valid  " }]);

    const res = await GET(request());
    const data = await res.json();

    expect(data.slug).toBe("valid");
  });

  it("returns 404 when no approved projects exist", async () => {
    mockProjects([]);

    const res = await GET(request());

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: "No approved projects available",
    });
  });

  it("returns 500 when the database query fails", async () => {
    inFilter.mockResolvedValue({ data: null, error: new Error("boom") });

    const res = await GET(request());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Internal server error" });
  });
});
