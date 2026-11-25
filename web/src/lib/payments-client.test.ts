import { describe, expect, it } from "vitest";
import { buildSep7PayUri } from "./payments-client";

const TEST_DESTINATION = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";

describe("buildSep7PayUri", () => {
  it("builds a SEP-7 pay URI with destination, amount, and text memo", () => {
    const uri = buildSep7PayUri({
      destination: TEST_DESTINATION,
      amountXlm: 50,
      memo: "spotlight",
    });

    expect(uri).toBe(
      `web+stellar:pay?destination=${TEST_DESTINATION}&amount=50&memo=spotlight&memo_type=MEMO_TEXT`,
    );
  });

  it("formats fractional XLM amounts without trailing zeros", () => {
    const uri = buildSep7PayUri({
      destination: TEST_DESTINATION,
      amountXlm: 12.5,
      memo: "spotlight",
    });

    expect(uri).toContain("amount=12.5");
  });

  it("omits memo and memo_type when memo is not provided", () => {
    const uri = buildSep7PayUri({
      destination: TEST_DESTINATION,
      amountXlm: 15,
    });

    expect(uri).toBe(`web+stellar:pay?destination=${TEST_DESTINATION}&amount=15`);
  });

  it("URL-encodes special characters in memo", () => {
    const uri = buildSep7PayUri({
      destination: TEST_DESTINATION,
      amountXlm: 10,
      memo: "project #42",
    });

    const parsed = new URL(uri);
    expect(parsed.searchParams.get("memo")).toBe("project #42");
    expect(parsed.searchParams.get("memo_type")).toBe("MEMO_TEXT");
  });
});
