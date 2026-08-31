import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase", () => ({
  getSupabase: vi.fn(),
}));

import { getSupabase } from "@/lib/firebase";
import { notifyMaintainers } from "@/lib/notifications";

describe("notifyMaintainers", () => {
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getSupabase as any).mockReturnValue({ from: mockFrom });
  });

  it("queries maintainer and admin users", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockIn = vi.fn().mockResolvedValue({
      data: [{ numericId: 1 }, { numericId: 2 }],
      error: null,
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return { select: () => ({ in: mockIn }) };
      }
      if (table === "notifications") {
        return { insert: mockInsert };
      }
      return {};
    });

    await notifyMaintainers({
      type: "submission",
      title: "New submission: Test Project",
      body: "Test Project was submitted and is pending review.",
      link: "/admin",
      project_id: 123,
    });

    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockIn).toHaveBeenCalledWith("role", ["maintainer", "admin"]);
  });

  it("inserts notifications for each maintainer", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockIn = vi.fn().mockResolvedValue({
      data: [{ numericId: 1 }, { numericId: 2 }],
      error: null,
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return { select: () => ({ in: mockIn }) };
      }
      if (table === "notifications") {
        return { insert: mockInsert };
      }
      return {};
    });

    await notifyMaintainers({
      type: "submission",
      title: "New submission: Test Project",
      body: "Test Project body",
      link: "/admin",
      project_id: 123,
    });

    expect(mockFrom).toHaveBeenCalledWith("notifications");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted).toHaveLength(2);
    expect(inserted[0].user_id).toBe(1);
    expect(inserted[0].type).toBe("submission");
    expect(inserted[0].project_id).toBe(123);
    expect(inserted[1].user_id).toBe(2);
  });

  it("does not fail when there are no maintainers", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
        };
      }
      return {};
    });

    await expect(
      notifyMaintainers({
        type: "submission",
        title: "Test",
        body: "Test body",
        link: "/admin",
      })
    ).resolves.toBeUndefined();
  });

  it("handles notification failure gracefully (no throw)", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("DB error");
    });

    await expect(
      notifyMaintainers({
        type: "submission",
        title: "Test",
        body: "Test body",
        link: "/admin",
      })
    ).resolves.toBeUndefined();
  });
});
