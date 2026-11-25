/**
 * Role allow/deny tests for PUT /api/projects/[id]/reject (#411).
 *
 * Each role is asserted against the real route handler with the Supabase
 * collection helpers mocked, so we verify both the status code and that the
 * database update only happens when the role is allowed to reject.
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

function rejectRequest(body: Record<string, unknown> = { reason: "Missing license" }) {
  return new Request("http://localhost/api/projects/doc-1/reject", {
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

function authAs(role: string | null, userId = 200) {
  vi.mocked(getAuthUser).mockReturnValue(role ? { userId, role } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Drop any unconsumed queued reads so tests cannot pollute each other.
  docGet.mockReset();
  docUpdate.mockReset().mockResolvedValue(undefined);
});

describe("PUT /api/projects/[id]/reject role matrix", () => {
  it("anonymous users get 403 and the database is never touched", async () => {
    authAs(null);

    const res = await PUT(rejectRequest(), params);

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Forbidden");
    expect(docGet).not.toHaveBeenCalled();
    expect(docUpdate).not.toHaveBeenCalled();
    expect(logModerationAction).not.toHaveBeenCalled();
  });

  it("contributors get 403 and the database is never touched", async () => {
    authAs("contributor", 201);

    const res = await PUT(rejectRequest(), params);

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Forbidden");
    expect(docGet).not.toHaveBeenCalled();
    expect(docUpdate).not.toHaveBeenCalled();
    expect(logModerationAction).not.toHaveBeenCalled();
  });

  it("maintainers get 200, the project is updated and the action logged", async () => {
    authAs("maintainer", 202);
    seedExistingProject();

    const res = await PUT(rejectRequest({ reason: "Missing license" }), params);

    expect(res.status).toBe(200);
    expect(docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", rejection_reason: "Missing license" }),
    );
    expect(logModerationAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 202,
        action: "reject",
        project_id: 42,
        reason: "Missing license",
      }),
    );
    expect(createNotification).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.project.id).toBe(42);
  });

  it("admins get 200 with the same reject path", async () => {
    authAs("admin", 203);
    seedExistingProject();

    const res = await PUT(rejectRequest({ reason: "Duplicate" }), params);

    expect(res.status).toBe(200);
    expect(docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", rejection_reason: "Duplicate" }),
    );
    expect(logModerationAction).toHaveBeenCalledWith(
      expect.objectContaining({ actor_id: 203, action: "reject" }),
    );
  });

  it("rejects without a reason still succeed and store null reason", async () => {
    authAs("maintainer", 204);
    seedExistingProject();

    const res = await PUT(rejectRequest({}), params);

    expect(res.status).toBe(200);
    expect(docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", rejection_reason: null }),
    );
  });

  it("returns 404 for a missing project without updating anything", async () => {
    authAs("maintainer", 205);
    docGet.mockResolvedValueOnce({ exists: false });

    const res = await PUT(rejectRequest(), params);

    expect(res.status).toBe(404);
    expect(docUpdate).not.toHaveBeenCalled();
  });
});
