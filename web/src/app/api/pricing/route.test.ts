import { afterEach, describe, expect, it } from "vitest";
import { getProducts } from "@/lib/pricing";
import { GET } from "./route";

const original = process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM;

afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM;
  else process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM = original;
});

describe("GET /api/pricing", () => {
  it("returns the same catalog as lib/pricing", async () => {
    process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM = "250";
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.currency).toBe("XLM");
    expect(body.products).toEqual(getProducts());
    expect(body.products.pro.priceXlm).toBe(250);
  });

  it("returns 500 when a price is misconfigured", async () => {
    process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM = "not-a-number";
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Pricing is not configured correctly");
  });
});
