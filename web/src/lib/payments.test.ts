import { beforeEach, describe, expect, it, vi } from "vitest";

const { lookupTransaction, lookupOperations } = vi.hoisted(() => ({
  lookupTransaction: vi.fn(),
  lookupOperations: vi.fn(),
}));
vi.mock("@stellar/stellar-sdk", () => ({
  Horizon: {
    Server: class {
      transactions() { return { transaction: (hash: string) => ({ call: () => lookupTransaction(hash) }) }; }
      operations() { return { forTransaction: (hash: string) => ({ limit: () => ({ call: () => lookupOperations(hash) }) }) }; }
    },
  },
}));

import { verifyStellarPayment } from "./payments";

const hash = "a".repeat(64);
beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_CONTRACT_NETWORK = "testnet";
  lookupTransaction.mockResolvedValue({ successful: true });
  lookupOperations.mockResolvedValue({ records: [{
    type: "payment",
    transaction_successful: true,
    asset_type: "native",
    to: "GDONATIONS",
    from: "GSENDER",
    amount: "12.3456789",
  }] });
});

describe("verifyStellarPayment for donations", () => {
  it("uses Horizon's amount and canonicalizes the hash before redemption", async () => {
    const payment = await verifyStellarPayment(hash.toUpperCase(), undefined, "GDONATIONS");
    expect(payment).toMatchObject({ txHash: hash, amountXlm: "12.3456789", destinationAddress: "GDONATIONS" });
    expect(lookupTransaction).toHaveBeenCalledWith(hash);
    expect(lookupOperations).toHaveBeenCalledWith(hash);
  });

  it("rejects payments to a different address or with zero amount", async () => {
    await expect(verifyStellarPayment(hash, undefined, "GOTHER")).rejects.toThrow();
    lookupOperations.mockResolvedValue({ records: [{
      type: "payment", transaction_successful: true, asset_type: "native",
      to: "GDONATIONS", from: "GSENDER", amount: "0",
    }] });
    await expect(verifyStellarPayment(hash, undefined, "GDONATIONS")).rejects.toThrow();
  });
});
