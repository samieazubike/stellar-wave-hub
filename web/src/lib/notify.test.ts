import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyPurchase } from "./notify";

describe("notifyPurchase", () => {
  const originalWebhookUrl = process.env.DISCORD_PAYMENTS_WEBHOOK_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.DISCORD_PAYMENTS_WEBHOOK_URL;
  });

  afterEach(() => {
    if (originalWebhookUrl === undefined) {
      delete process.env.DISCORD_PAYMENTS_WEBHOOK_URL;
    } else {
      process.env.DISCORD_PAYMENTS_WEBHOOK_URL = originalWebhookUrl;
    }
  });

  it("is a no-op when DISCORD_PAYMENTS_WEBHOOK_URL is unset", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await notifyPurchase({
      product: "spotlight",
      amount: "50",
      project_id: 42,
      network: "testnet",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts product, amount, and project to DISCORD_PAYMENTS_WEBHOOK_URL on testnet purchases", async () => {
    process.env.DISCORD_PAYMENTS_WEBHOOK_URL = "https://discord.com/api/webhooks/test/token";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));

    await notifyPurchase({
      product: "spotlight",
      amount: "50",
      project_id: 42,
      project_name: "Stellar Wave",
      network: "testnet",
      tx_hash: "a".repeat(64),
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://discord.com/api/webhooks/test/token");
    expect(init?.method).toBe("POST");

    const body = JSON.parse(String(init?.body));
    expect(body.embeds).toHaveLength(1);
    const fields = body.embeds[0].fields as Array<{ name: string; value: string }>;
    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Product", value: "spotlight" }),
        expect.objectContaining({ name: "Amount", value: "50 XLM" }),
        expect.objectContaining({ name: "Project", value: "Stellar Wave (#42)" }),
        expect.objectContaining({ name: "Network", value: "testnet" }),
      ]),
    );
  });

  it("swallows network and non-OK webhook failures without throwing", async () => {
    process.env.DISCORD_PAYMENTS_WEBHOOK_URL = "https://discord.com/api/webhooks/test/token";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network down"));
    await expect(
      notifyPurchase({
        product: "spotlight",
        amount: "50",
        project_id: 42,
        network: "testnet",
      }),
    ).resolves.toBeUndefined();

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("rate limited", { status: 429, statusText: "Too Many Requests" }),
    );
    await expect(
      notifyPurchase({
        product: "spotlight",
        amount: "50",
        project_id: 42,
        network: "testnet",
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
