import { describe, expect, it } from "vitest";
import { ownerReplySchema } from "@/lib/validation/schemas/ratings";
import { signToken } from "@/lib/auth";
import { DELETE, PUT } from "./route";

describe("ownerReplySchema", () => {
  it("accepts and trims a valid reply", () => {
    const res = ownerReplySchema.safeParse({ owner_reply: "   Thanks for the review!   " });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.owner_reply).toBe("Thanks for the review!");
  });

  it("rejects empty or whitespace-only replies", () => {
    expect(ownerReplySchema.safeParse({ owner_reply: "" }).success).toBe(false);
    expect(ownerReplySchema.safeParse({ owner_reply: "   " }).success).toBe(false);
  });

  it("rejects replies over 5000 characters", () => {
    expect(ownerReplySchema.safeParse({ owner_reply: "a".repeat(5001) }).success).toBe(false);
  });
});

describe("/api/ratings/[id]/reply", () => {
  const params = { params: Promise.resolve({ id: "1" }) };

  it("PUT returns 401 without a token", async () => {
    const res = await PUT(
      new Request("http://localhost/api/ratings/1/reply", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_reply: "Test reply" }),
      }),
      params,
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  it("DELETE returns 401 without a token", async () => {
    const res = await DELETE(new Request("http://localhost/api/ratings/1/reply", { method: "DELETE" }), params);
    expect(res.status).toBe(401);
  });

  it("PUT returns 400 for an empty reply before touching the database", async () => {
    const token = signToken({ userId: 1, role: "contributor" });
    const res = await PUT(
      new Request("http://localhost/api/ratings/1/reply", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ owner_reply: "" }),
      }),
      params,
    );
    expect(res.status).toBe(400);
  });
});
