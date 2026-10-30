import { describe, expect, it, vi } from "vitest";

// Mock the Firestore `projects` collection at the module boundary used by the
// queue route. Firestore `QuerySnapshot` shape: `{ docs: [QueryDocumentSnapshot] }`
// where each document exposes `data(): Record<string, unknown>`.
const mockFirestoreDb = vi.hoisted(() => {
  let state: Array<{ numericId: number; id: number }> = [];
  return (projects: Array<{ numericId: number; id: number }> = []) => {
    state = projects;
    return {
      ref: {
        where: vi.fn(() => ({
          get: vi.fn(async () => ({
            docs: state.map((p) => ({
              data: () => ({ numericId: p.numericId, id: p.id }),
            })),
          })),
        })),
      },
    };
  };
});

// Mock the live Supabase connection used by `getSupabase()`.
const mockSupabaseClient = vi.hoisted(() => {
  let state: Array<{ numeric_id: number; priority: number; order_index: number }> = [];
  return (ordered: Array<{ numeric_id: number; priority: number; order_index: number }> = []) => {
    state = ordered;
    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({ data: state, error: null })),
      })),
    }));
    return { from: fromMock };
  };
});

const mockProject = (overrides: Partial<{ numericId: number; id: number }> = {}) => ({
  numericId: overrides.numericId ?? 1,
  id: overrides.id ?? 1,
  name: "Fast-track demo",
  slug: "fast-track-demo",
  description: "A submitted project with a paid priority review slot.",
  category: "Payments",
  tags: null,
  stellar_network: "mainnet",
  github_url: null,
  github_repos: [],
  username: "researcher",
  created_at: "2026-10-20T10:00:00.000Z",
  claimed_by: null,
  claimed_by_username: null,
  claimed_at: null,
});

let fromMock: ReturnType<typeof mockSupabaseClient>["from"] = vi.fn(() => ({
  select: vi.fn(() => ({
    order: vi.fn(() => ({ data: [], error: null })),
  })),
}));

vi.mock("@/lib/db", () => ({
  projectsCol: mockFirestoreDb(),
}));

vi.mock("@/lib/firebase", () => ({
  getSupabase: vi.fn(() => ({ from: fromMock })),
}));

describe("GET /api/projects/queue — paid priority review", () => {
  it("returns an empty queue when there are no submitted projects", async () => {
    mockFirestoreDb([]);
    fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({ data: [], error: null })),
      })),
    }));
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/projects/queue", {
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { projects: unknown[]; total: number };
    expect(body.projects).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("surfaces paid fast-track entries to the client queue with priority data", async () => {
    mockFirestoreDb([{ numericId: 2, id: 2 }, { numericId: 3, id: 3 }, { numericId: 4, id: 4 }, { numericId: 5, id: 5 }, { numericId: 6, id: 6 }]);
    fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({ data: [{ numeric_id: 1, priority: 10, order_index: 1 }], error: null })),
      })),
    }));
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/projects/queue", {
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      projects: Array<{ is_fast_track?: boolean }>;
      total: number;
    };
    expect(body.total).toBe(6);
    expect(body.projects[0].is_fast_track).toBe(true);
    // Paid (fast-track) project surfaces first
    expect(body.projects[0].id).toBe(1);
    // Unpaid projects keep their submission order
    expect(body.projects[1].id).toBe(2);
    expect(body.projects[2].id).toBe(3);
    expect(body.projects[3].id).toBe(4);
    expect(body.projects[4].id).toBe(5);
  });
});
