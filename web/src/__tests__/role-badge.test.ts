import { describe, it, expect, vi } from "vitest";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("@/context/AuthContext");

describe("RoleBadge component behaviour", () => {
  it("returns null when user is null (no render)", async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const RoleBadge = (await import("@/components/RoleBadge")).default;
    const result = RoleBadge();
    expect(result).toBeNull();
  });

  it("returns null when user has no role", async () => {
    (useAuth as any).mockReturnValue({ user: { username: "test" } });

    const RoleBadge = (await import("@/components/RoleBadge")).default;
    const result = RoleBadge();
    expect(result).toBeNull();
  });

  it("renders role text for maintainer user", async () => {
    (useAuth as any).mockReturnValue({
      user: { role: "maintainer", username: "testmod" },
    });

    const RoleBadge = (await import("@/components/RoleBadge")).default;
    const element = RoleBadge()!;
    const props = (element as any).props;
    expect(props.children).toBe("maintainer");
  });

  it("renders role text for admin user", async () => {
    (useAuth as any).mockReturnValue({
      user: { role: "admin", username: "testadmin" },
    });

    const RoleBadge = (await import("@/components/RoleBadge")).default;
    const element = RoleBadge()!;
    const props = (element as any).props;
    expect(props.children).toBe("admin");
  });

  it("renders role text for contributor user", async () => {
    (useAuth as any).mockReturnValue({
      user: { role: "contributor", username: "testcontrib" },
    });

    const RoleBadge = (await import("@/components/RoleBadge")).default;
    const element = RoleBadge()!;
    const props = (element as any).props;
    expect(props.children).toBe("contributor");
  });
});
