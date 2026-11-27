import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { signToken } from "@/lib/auth";

const { statusMock } = vi.hoisted(() => ({
  statusMock: vi.fn(),
}));

vi.mock("@/lib/supporters", () => ({
  getSupporterStatus: statusMock,
}));

describe("GET /api/supporters/me", () => {
  beforeEach(() => {
    statusMock.mockReset();
  });

  it("rejects missing or invalid authorization", async () => {
    const missing = await GET(new Request("http://localhost/api/supporters/me"));
    expect(missing.status).toBe(401);
    expect(await missing.json()).toEqual({ error: "Unauthorized" });

    const invalid = await GET(
      new Request("http://localhost/api/supporters/me", {
        headers: { Authorization: "Bearer invalid-token" },
      }),
    );
    expect(invalid.status).toBe(401);
  });

  it("returns the authenticated user's supporter status", async () => {
    const status = {
      is_supporter: true,
      total_xlm: 12,
      threshold: 10,
    };
    statusMock.mockResolvedValue(status);
    const token = signToken({ userId: 42, role: "contributor" });

    const res = await GET(
      new Request("http://localhost/api/supporters/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await res.json()).toEqual(status);
    expect(statusMock).toHaveBeenCalledWith(42);
  });

  it("reports helper failures with an actionable message", async () => {
    statusMock.mockRejectedValue(new Error("payments table unavailable"));
    const token = signToken({ userId: 42, role: "contributor" });

    const res = await GET(
      new Request("http://localhost/api/supporters/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "payments table unavailable" });
  });
});
