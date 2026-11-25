/**
 * Role allow/deny tests for PUT /api/projects/[id]/approve (#411).
 *
 * Each role is asserted against the real route handler with the Supabase
 * collection helpers mocked, so we verify both the status code and that the
 * database update only happens when the role is allowed to approve.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthUser } from "@/lib/auth";

const { docGet, docUpdate, logModerationAction, createNotification } = vi.hoisted(() => ({
  docGet: vi.fn(),
  docUpdate: vi.fn(),
  logModerationAction: vi.fn(async () => undefined),
  createNotification: vi.fn(async () => undefined),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getAuthUser: vi.fn() };
});

vi.mock("@/lib/db", () => ({
  projectsCol: { ref: { doc: vi.fn(() => ({ get: docGet, update: docUpdate })) } },
  logModerationAction,
  createNotification,
}));

vi.mock("@/lib/public-project-cache", () => ({
  revalidatePublicProjectCache: vi.fn(),
  publicProjectCacheHeaders: { "Cache-Control": "public" },
}));

import { PUT } from "./route";

const params = { params: Promise.resolve({ id: "doc-1" }) };

const projectData = {
  numericId: 42,
  user_id: 7,
  name: "Nebula Tracker",
  status: "pending",
  featured: 0,
};

function approveRequest(body: Record<string, unknown> = { featured: false }) {
  return new Request("http://localhost/api/projects/doc-1/approve", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** First read returns the existing project; the post-update read returns its data. */
function seedExistingProject() {
  docGet.mockResolvedValueOnce({ exists: true }).mockResolvedValueOnce({
    exists: true,
    data: () => projectData,
  });
}

function authAs(role: string | null, userId = 100) {
  vi.mocked(getAuthUser).mockReturnValue(role ? { userId, role } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Drop any unconsumed queued reads so tests cannot pollute each other.
  docGet.mockReset();
  docUpdate.mockReset().mockResolvedValue(undefined);
});

describe("PUT /api/projects/[id]/approve role matrix", () => {
  it("anonymous users get 403 and the database is never touched", async () => {
    authAs(null);

    const res = await PUT(approveRequest(), params);

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Forbidden");
    expect(docGet).not.toHaveBeenCalled();
    expect(docUpdate).not.toHaveBeenCalled();
    expect(logModerationAction).not.toHaveBeenCalled();
  });

  it("contributors get 403 and the database is never touched", async () => {
    authAs("contributor", 101);

    const res = await PUT(approveRequest(), params);

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Forbidden");
    expect(docGet).not.toHaveBeenCalled();
    expect(docUpdate).not.toHaveBeenCalled();
    expect(logModerationAction).not.toHaveBeenCalled();
  });

  it("maintainers get 200, the project is updated and the action logged", async () => {
    authAs("maintainer", 102);
    seedExistingProject();

    const res = await PUT(approveRequest({ featured: false }), params);

    expect(res.status).toBe(200);
    expect(docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved", featured: 0 }),
    );
    expect(logModerationAction).toHaveBeenCalledWith(
      expect.objectContaining({ actor_id: 102, action: "approve", project_id: 42 }),
    );
    expect(createNotification).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.project.id).toBe(42);
  });

  it("maintainers cannot feature a project (admin-only) and get 403", async () => {
    authAs("maintainer", 103);
    // The route reads the doc once, then denies before any update.
    docGet.mockResolvedValueOnce({ exists: true });

    const res = await PUT(approveRequest({ featured: true }), params);

    expect(res.status).toBe(403);
    expect(docUpdate).not.toHaveBeenCalled();
    expect(logModerationAction).not.toHaveBeenCalled();
  });

  it("admins get 200 and may approve with featured", async () => {
    authAs("admin", 104);
    seedExistingProject();

    const res = await PUT(approveRequest({ featured: true }), params);

    expect(res.status).toBe(200);
    expect(docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "featured", featured: 1 }),
    );
    expect(logModerationAction).toHaveBeenCalledWith(
      expect.objectContaining({ actor_id: 104, action: "feature" }),
    );
  });

  it("returns 404 for a missing project without updating anything", async () => {
    authAs("maintainer", 105);
    docGet.mockResolvedValueOnce({ exists: false });

    const res = await PUT(approveRequest(), params);

    expect(res.status).toBe(404);
    expect(docUpdate).not.toHaveBeenCalled();
  });
});
