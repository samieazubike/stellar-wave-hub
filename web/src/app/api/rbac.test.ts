/**
 * Role-based access control tests for every moderated API route (#253).
 *
 * Each route is called as an anonymous visitor, a contributor, a maintainer
 * and an admin, and the test asserts that the role gets a 2xx or a 401/403.
 * The expected outcomes follow the permission matrix in CONTRIBUTING.md
 * ("Roles and Permissions"). The data layer is replaced with an in-memory
 * store so the tests exercise the real route handlers and auth helpers.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

// ── In-memory data layer ──────────────────────────────────────────────────
const store = vi.hoisted(() => {
  const tables = new Map<string, Map<string, Row>>();

  function table(name: string) {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name)!;
  }

  function snapshot(id: string, data: Row | undefined) {
    return {
      id,
      exists: data !== undefined,
      data: () => (data ? { ...data } : undefined),
      ref: docRef("__unknown__", id),
    };
  }

  function docRef(name: string, id: string) {
    return {
      id,
      async get() {
        return snapshot(id, table(name).get(id));
      },
      async set(data: Row) {
        table(name).set(id, { ...data });
      },
      async update(data: Row) {
        const current = table(name).get(id);
        if (current) table(name).set(id, { ...current, ...data });
      },
      async delete() {
        table(name).delete(id);
      },
    };
  }

  type Filter = { field: string; op: string; value: unknown };

  function query(name: string, filters: Filter[] = [], max?: number) {
    return {
      where(field: string, op: string, value: unknown) {
        return query(name, [...filters, { field, op, value }], max);
      },
      orderBy() {
        return query(name, filters, max);
      },
      limit(n: number) {
        return query(name, filters, n);
      },
      async get() {
        let docs = [...table(name).entries()].filter(([, row]) =>
          filters.every((f) =>
            f.op === "in"
              ? (f.value as unknown[]).includes(row[f.field])
              : row[f.field] === f.value,
          ),
        );
        if (max !== undefined) docs = docs.slice(0, max);
        const mapped = docs.map(([id, row]) => ({
          ...snapshot(id, row),
          ref: docRef(name, id),
        }));
        return { empty: mapped.length === 0, docs: mapped };
      },
    };
  }

  function collection(name: string) {
    return {
      ...query(name),
      doc: (id: string) => docRef(name, id),
      firestore: {
        batch() {
          const ops: Array<() => Promise<void>> = [];
          return {
            delete(ref: { delete: () => Promise<void> }) {
              ops.push(() => ref.delete());
            },
            async commit() {
              for (const op of ops) await op();
            },
          };
        },
      },
    };
  }

  function reset() {
    tables.clear();
  }

  return { table, collection, reset };
});

vi.mock("@/lib/db", () => {
  const col = (name: string) => ({
    get ref() {
      return store.collection(name);
    },
  });
  return {
    projectsCol: col("projects"),
    usersCol: col("users"),
    ratingsCol: col("ratings"),
    maintainerCategoriesCol: col("maintainer_categories"),
    createNotification: vi.fn(async () => 1),
    logModerationAction: vi.fn(async () => undefined),
    nextId: vi.fn(async () => 1),
  };
});

// Supabase is only reached by the admin user-management routes.
vi.mock("@/lib/firebase", () => {
  function chain(result: unknown): unknown {
    return new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") {
            return (resolve: (value: unknown) => void) => resolve(result);
          }
          return () => chain(result);
        },
      },
    );
  }
  return {
    getSupabase: () => ({
      from: () => chain({ data: [], count: 0, error: null }),
      rpc: async (_fn: string, args: { target_id: number; new_role: string }) => ({
        data: { numericId: args.target_id, role: args.new_role },
        error: null,
      }),
    }),
  };
});

vi.mock("@/lib/public-project-cache", () => ({
  publicProjectCacheHeaders: {},
  revalidatePublicProjectCache: vi.fn(),
}));

// Rate limiting is covered by its own tests; keep it out of the way here.
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
  rateLimitExceededResponse: () => Response.json({ error: "Too many requests" }, { status: 429 }),
  getClientIp: () => "127.0.0.1",
}));

import { signToken } from "@/lib/auth";
import { PUT as approve } from "./projects/[id]/approve/route";
import { PUT as reject } from "./projects/[id]/reject/route";
import { PUT as delist } from "./projects/[id]/delist/route";
import { DELETE as deleteProject } from "./projects/[id]/delete/route";
import { PUT as changeRole } from "./admin/users/[id]/role/route";
import { GET as listUsers } from "./admin/users/route";
import { GET as listAdminProjects } from "./admin/projects/route";

// ── Fixtures ──────────────────────────────────────────────────────────────
type Persona = "anonymous" | "contributor" | "maintainer" | "admin";

const USERS = {
  contributor: { numericId: 10, username: "carol", role: "contributor" },
  maintainer: { numericId: 20, username: "max", role: "maintainer" },
  admin: { numericId: 30, username: "ada", role: "admin" },
  target: { numericId: 40, username: "tess", role: "contributor" },
} as const;

const PROJECT_ID = "100";

function seed() {
  store.reset();
  for (const user of Object.values(USERS)) {
    store.table("users").set(String(user.numericId), { ...user });
  }
  store.table("projects").set(PROJECT_ID, {
    numericId: Number(PROJECT_ID),
    name: "Lumen Lend",
    slug: "lumen-lend",
    description: "A lending protocol on Stellar.",
    category: "defi",
    status: "submitted",
    featured: 0,
    user_id: USERS.target.numericId,
    created_at: "2026-11-01T00:00:00.000Z",
  });
  store.table("maintainer_categories").set("1", {
    userId: USERS.maintainer.numericId,
    category: "defi",
  });
}

function headersFor(persona: Persona): HeadersInit {
  if (persona === "anonymous") return {};
  const user = USERS[persona];
  return { Authorization: `Bearer ${signToken({ userId: user.numericId, role: user.role })}` };
}

function jsonRequest(persona: Persona, method: string, path: string, body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headersFor(persona) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const projectParams = () => ({ params: Promise.resolve({ id: PROJECT_ID }) });
const userParams = () => ({ params: Promise.resolve({ id: String(USERS.target.numericId) }) });

type Expectation = "allow" | "deny";

interface RouteCase {
  name: string;
  call: (persona: Persona) => Promise<Response>;
  expected: Record<Persona, Expectation>;
}

/**
 * The permission matrix, expressed as allow/deny per role. Comments note
 * where the current implementation is stricter than CONTRIBUTING.md.
 */
const ROUTES: RouteCase[] = [
  {
    name: "PUT /api/projects/:id/approve",
    call: (p) => approve(jsonRequest(p, "PUT", `/api/projects/${PROJECT_ID}/approve`, {}), projectParams()),
    expected: { anonymous: "deny", contributor: "deny", maintainer: "allow", admin: "allow" },
  },
  {
    name: "PUT /api/projects/:id/approve (feature)",
    call: (p) =>
      approve(
        jsonRequest(p, "PUT", `/api/projects/${PROJECT_ID}/approve`, { featured: true }),
        projectParams(),
      ),
    // CONTRIBUTING.md lists "Approve/feature" for maintainers, but featuring
    // is admin-only in the route.
    expected: { anonymous: "deny", contributor: "deny", maintainer: "deny", admin: "allow" },
  },
  {
    name: "PUT /api/projects/:id/reject",
    call: (p) =>
      reject(
        jsonRequest(p, "PUT", `/api/projects/${PROJECT_ID}/reject`, { reason: "Incomplete" }),
        projectParams(),
      ),
    expected: { anonymous: "deny", contributor: "deny", maintainer: "allow", admin: "allow" },
  },
  {
    name: "PUT /api/projects/:id/delist",
    call: (p) =>
      delist(
        jsonRequest(p, "PUT", `/api/projects/${PROJECT_ID}/delist`, { reason: "Abandoned" }),
        projectParams(),
      ),
    // CONTRIBUTING.md lists delist for maintainers, but the route is admin-only.
    expected: { anonymous: "deny", contributor: "deny", maintainer: "deny", admin: "allow" },
  },
  {
    name: "DELETE /api/projects/:id/delete",
    call: (p) => deleteProject(jsonRequest(p, "DELETE", `/api/projects/${PROJECT_ID}/delete`), projectParams()),
    expected: { anonymous: "deny", contributor: "deny", maintainer: "deny", admin: "allow" },
  },
  {
    name: "GET /api/admin/projects?status=pending",
    call: (p) => listAdminProjects(jsonRequest(p, "GET", "/api/admin/projects?status=pending")),
    expected: { anonymous: "deny", contributor: "deny", maintainer: "allow", admin: "allow" },
  },
  {
    name: "GET /api/admin/projects (all statuses)",
    call: (p) => listAdminProjects(jsonRequest(p, "GET", "/api/admin/projects")),
    expected: { anonymous: "deny", contributor: "deny", maintainer: "deny", admin: "allow" },
  },
  {
    name: "GET /api/admin/users",
    call: (p) => listUsers(jsonRequest(p, "GET", "/api/admin/users")),
    expected: { anonymous: "deny", contributor: "deny", maintainer: "deny", admin: "allow" },
  },
  {
    name: "PUT /api/admin/users/:id/role",
    call: (p) =>
      changeRole(
        jsonRequest(p, "PUT", `/api/admin/users/${USERS.target.numericId}/role`, { role: "maintainer" }),
        userParams(),
      ),
    expected: { anonymous: "deny", contributor: "deny", maintainer: "deny", admin: "allow" },
  },
];

const PERSONAS: Persona[] = ["anonymous", "contributor", "maintainer", "admin"];

describe("role-based access control", () => {
  beforeEach(() => {
    seed();
  });

  for (const route of ROUTES) {
    describe(route.name, () => {
      for (const persona of PERSONAS) {
        const expectation = route.expected[persona];
        it(`${expectation === "allow" ? "allows" : "denies"} ${persona}`, async () => {
          const response = await route.call(persona);
          if (expectation === "allow") {
            expect(response.status, `${persona} should get 2xx`).toBeGreaterThanOrEqual(200);
            expect(response.status, `${persona} should get 2xx`).toBeLessThan(300);
          } else if (persona === "anonymous") {
            expect([401, 403], "anonymous should get 401/403").toContain(response.status);
          } else {
            expect(response.status, `${persona} should get 403`).toBe(403);
          }
        });
      }
    });
  }

  it("denied requests leave the project untouched", async () => {
    for (const persona of ["anonymous", "contributor"] as const) {
      await approve(jsonRequest(persona, "PUT", `/api/projects/${PROJECT_ID}/approve`, {}), projectParams());
      await reject(jsonRequest(persona, "PUT", `/api/projects/${PROJECT_ID}/reject`, {}), projectParams());
      await deleteProject(jsonRequest(persona, "DELETE", `/api/projects/${PROJECT_ID}/delete`), projectParams());
    }
    expect(store.table("projects").get(PROJECT_ID)?.status).toBe("submitted");
  });

  it("a demoted admin's old token can no longer change roles", async () => {
    // The role route re-reads the actor's role from the database, so a token
    // issued while the user was an admin stops working once they are demoted.
    store.table("users").set(String(USERS.admin.numericId), { ...USERS.admin, role: "contributor" });
    const response = await changeRole(
      jsonRequest("admin", "PUT", `/api/admin/users/${USERS.target.numericId}/role`, { role: "admin" }),
      userParams(),
    );
    expect(response.status).toBe(403);
  });

  it("rejects tokens signed with the wrong secret", async () => {
    const response = await approve(
      new Request(`http://localhost/api/projects/${PROJECT_ID}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" },
        body: "{}",
      }),
      projectParams(),
    );
    expect(response.status).toBe(403);
  });
});
