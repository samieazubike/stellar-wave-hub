import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyPayment, insertPayment } = vi.hoisted(() => ({
  verifyPayment: vi.fn(),
  insertPayment: vi.fn(),
}));
vi.mock("@/lib/payments", () => ({ verifyStellarPayment: verifyPayment }));
vi.mock("@/lib/firebase", () => ({
  getSupabase: () => ({ from: () => ({ insert: insertPayment }) }),
}));

import { POST } from "./route";

const hash = "a".repeat(64);
function request(body: unknown) {
  return new Request("http://localhost/api/donations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_DONATION_DESTINATION = "GTESTDESTINATION";
  verifyPayment.mockResolvedValue({
    txHash: hash,
    amountXlm: "12.3456789",
    sourceAddress: "GSENDER",
    destinationAddress: "GTESTDESTINATION",
    network: "testnet",
  });
  insertPayment.mockResolvedValue({ error: null });
});

describe("POST /api/donations", () => {
  it("records only the Horizon verified amount and the optional message", async () => {
    const response = await POST(request({ tx_hash: hash, amount: 99999, message: "  Keep building!  " }));
    expect(response.status).toBe(201);
    expect(verifyPayment).toHaveBeenCalledWith(hash, undefined, "GTESTDESTINATION");
    expect(insertPayment).toHaveBeenCalledWith(expect.objectContaining({
      tx_hash: hash,
      product: "donation",
      amount: "12.3456789",
      message: "Keep building!",
      user_id: null,
      project_id: null,
    }));
  });

  it("rejects a transaction already redeemed", async () => {
    insertPayment.mockResolvedValue({ error: { code: "23505" } });
    const response = await POST(request({ tx_hash: hash }));
    expect(response.status).toBe(409);
  });

  it("does not store an unverified payment", async () => {
    verifyPayment.mockRejectedValue(new Error("No matching operation"));
    const response = await POST(request({ tx_hash: hash }));
    expect(response.status).toBe(400);
    expect(insertPayment).not.toHaveBeenCalled();
  });
});
