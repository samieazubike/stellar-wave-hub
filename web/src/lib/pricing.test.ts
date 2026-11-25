import { afterEach, describe, expect, it } from "vitest";
import {
  MAX_MEMO_BYTES,
  PRODUCTS,
  PRODUCT_IDS,
  buildMemo,
  getPrice,
  getProduct,
  getProducts,
  isProductId,
} from "./pricing";

const PRICE_ENV_VARS = [
  "NEXT_PUBLIC_FEATURED_TIERS",
  "NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM",
  "NEXT_PUBLIC_PRICE_HERO_SPONSOR_XLM",
  "NEXT_PUBLIC_PRICE_PRIORITY_REVIEW_XLM",
  "NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM",
  "NEXT_PUBLIC_PRICE_PRO_YEAR_XLM",
  "NEXT_PUBLIC_PRICE_JOB_POST_XLM",
  "NEXT_PUBLIC_PRICE_API_PRO_MONTH_XLM",
] as const;

const saved = Object.fromEntries(PRICE_ENV_VARS.map((name) => [name, process.env[name]]));

function clearPriceEnv() {
  for (const name of PRICE_ENV_VARS) delete process.env[name];
}

afterEach(() => {
  for (const name of PRICE_ENV_VARS) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

describe("lib/pricing", () => {
  it("defines all eight products", () => {
    expect([...PRODUCT_IDS].sort()).toEqual(
      [
        "api_pro",
        "category_sponsor",
        "hero_sponsor",
        "job_post",
        "priority_review",
        "pro",
        "project_story",
        "spotlight",
      ].sort(),
    );
    expect(Object.keys(getProducts()).sort()).toEqual([...PRODUCT_IDS].sort());
  });

  it("uses the documented defaults when env is unset", () => {
    clearPriceEnv();
    expect(getPrice("spotlight")).toBe(50);
    expect(getPrice("category_sponsor")).toBe(40);
    expect(getPrice("hero_sponsor")).toBe(150);
    expect(getPrice("priority_review")).toBe(20);
    expect(getPrice("project_story")).toBe(60);
    expect(getPrice("pro")).toBe(200);
    expect(getPrice("job_post")).toBe(30);
    expect(getPrice("api_pro")).toBe(25);
  });

  it("reads every price from env at call time", () => {
    process.env.NEXT_PUBLIC_FEATURED_TIERS = "7:10,30:35,90:80";
    process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM = "41";
    process.env.NEXT_PUBLIC_PRICE_HERO_SPONSOR_XLM = "151";
    process.env.NEXT_PUBLIC_PRICE_PRIORITY_REVIEW_XLM = "21";
    process.env.NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM = "61";
    process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM = "201";
    process.env.NEXT_PUBLIC_PRICE_JOB_POST_XLM = "31";
    process.env.NEXT_PUBLIC_PRICE_API_PRO_MONTH_XLM = "25.5";

    expect(getPrice("spotlight")).toBe(35);
    expect(getProduct("spotlight").tiers).toEqual([
      { days: 7, priceXlm: 10 },
      { days: 30, priceXlm: 35 },
      { days: 90, priceXlm: 80 },
    ]);
    expect(getPrice("category_sponsor")).toBe(41);
    expect(getPrice("hero_sponsor")).toBe(151);
    expect(getPrice("priority_review")).toBe(21);
    expect(getPrice("project_story")).toBe(61);
    expect(getPrice("pro")).toBe(201);
    expect(getPrice("job_post")).toBe(31);
    expect(getPrice("api_pro")).toBe(25.5);
  });

  it("PRODUCTS lists every product and its defaults match getPrice() with env unset", () => {
    clearPriceEnv();
    expect(Object.keys(PRODUCTS).sort()).toEqual([...PRODUCT_IDS].sort());
    for (const id of PRODUCT_IDS) {
      expect(getPrice(id)).toBe(PRODUCTS[id].defaultPriceXlm);
      expect(getProduct(id).memoPrefix).toBe(PRODUCTS[id].memoPrefix);
      expect(getProduct(id).durationDays).toBe(PRODUCTS[id].durationDays);
    }
  });

  it("treats a blank env value as unset", () => {
    process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM = "  ";
    expect(getPrice("pro")).toBe(200);
  });

  it.each(["abc", "0", "-5", "1.12345678", "1e3"])(
    "throws on an invalid price %j instead of silently using the default",
    (value) => {
      process.env.NEXT_PUBLIC_PRICE_JOB_POST_XLM = value;
      expect(() => getPrice("job_post")).toThrow(/NEXT_PUBLIC_PRICE_JOB_POST_XLM/);
    },
  );

  it("throws for an unknown product", () => {
    expect(() => getPrice("lifetime_vip")).toThrow("Unknown product: lifetime_vip");
    expect(() => getProduct("")).toThrow(/Unknown product/);
    expect(isProductId("lifetime_vip")).toBe(false);
    expect(isProductId("pro")).toBe(true);
  });

  it("exposes duration and memo prefix for each product", () => {
    clearPriceEnv();
    const products = getProducts();
    expect(products.hero_sponsor).toMatchObject({ durationDays: 7, memoPrefix: "hero" });
    expect(products.category_sponsor).toMatchObject({ durationDays: 7, memoPrefix: "cat" });
    expect(products.pro).toMatchObject({ durationDays: 365, memoPrefix: "pro" });
    expect(products.job_post).toMatchObject({ durationDays: 30, memoPrefix: "job" });
    expect(products.api_pro).toMatchObject({ durationDays: 30, memoPrefix: "api" });
    expect(products.priority_review).toMatchObject({ durationDays: null, memoPrefix: "prio" });
    expect(products.project_story).toMatchObject({ durationDays: null, memoPrefix: "story" });
    expect(products.spotlight).toMatchObject({ durationDays: 30, memoPrefix: "spotlight" });
  });

  describe("buildMemo", () => {
    it("joins the prefix and parts with colons", () => {
      expect(buildMemo("hero_sponsor", "2026-11-23")).toBe("hero:2026-11-23");
      expect(buildMemo("category_sponsor", "defi", 42)).toBe("cat:defi:42");
      expect(buildMemo("spotlight")).toBe("spotlight");
    });

    it("rejects memos over Stellar's 28-byte limit", () => {
      const category = "x".repeat(MAX_MEMO_BYTES);
      expect(() => buildMemo("category_sponsor", category, 1)).toThrow(/28 bytes/);
    });
  });
});
