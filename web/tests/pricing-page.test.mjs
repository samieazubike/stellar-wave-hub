import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const pricingPageFile = path.join(webRoot, "src", "app", "pricing", "page.tsx");
const navbarFile = path.join(webRoot, "src", "components", "Navbar.tsx");
const footerFile = path.join(webRoot, "src", "components", "Footer.tsx");
const pricingModuleFile = path.join(webRoot, "src", "lib", "pricing.ts");
const apiPricingRouteFile = path.join(webRoot, "src", "app", "api", "pricing", "route.ts");

describe("Issue #498 /pricing page implementation", () => {
  test("pricing page file exists and is a client component", () => {
    assert.ok(fs.existsSync(pricingPageFile), "web/src/app/pricing/page.tsx must exist");
    const content = fs.readFileSync(pricingPageFile, "utf-8");
    assert.match(content, /^"use client";/, "page.tsx must be a client component");
  });

  test("pricing page fetches product cards from /api/pricing", () => {
    const content = fs.readFileSync(pricingPageFile, "utf-8");
    assert.match(content, /\/api\/pricing/, "page.tsx must fetch from /api/pricing");
    assert.match(content, /fetch\(\s*["']\/api\/pricing["']\s*\)/, "page.tsx must have fetch call to /api/pricing");
  });

  test("pricing page covers all 8 products with price, benefits, and CTA", () => {
    const content = fs.readFileSync(pricingPageFile, "utf-8");
    const expectedProducts = [
      "spotlight",
      "category_sponsor",
      "hero_sponsor",
      "priority_review",
      "project_story",
      "pro",
      "job_post",
      "api_pro",
    ];

    for (const id of expectedProducts) {
      assert.ok(
        content.includes(id),
        `Pricing page must contain product definition or key: ${id}`
      );
    }

    // Must reference benefits and CTAs
    assert.match(content, /benefits/i, "page.tsx must render benefits for products");
    assert.match(content, /ctaHref|ctaLabel/i, "page.tsx must render call-to-actions (CTAs)");
  });

  test("pricing page renders spotlight duration tiers (7, 30, 90 days)", () => {
    const content = fs.readFileSync(pricingPageFile, "utf-8");
    assert.match(content, /selectedSpotlightTier/i, "page.tsx must support spotlight tier selection");
    assert.match(content, /7d|7 days/i, "page.tsx must mention 7 day tier");
    assert.match(content, /30d|30 days/i, "page.tsx must mention 30 day tier");
    assert.match(content, /90d|90 days/i, "page.tsx must mention 90 day tier");
  });

  test("pricing page includes FAQ covering how XLM payments work and refunds policy", () => {
    const content = fs.readFileSync(pricingPageFile, "utf-8");

    // XLM payments
    assert.match(content, /How.*XLM.*payments.*work/i, "page.tsx must have an FAQ on how XLM payments work");
    assert.match(content, /memo/i, "page.tsx must explain transaction memo requirement in XLM payment FAQ");
    assert.match(content, /Freighter|wallet/i, "page.tsx must mention wallets for XLM payments");

    // Refunds policy
    assert.match(content, /refund/i, "page.tsx must have an FAQ or notice on refunds policy");
    assert.match(content, /blockchain|irreversible|immutable|transaction hash/i, "page.tsx must explain on-chain refund constraints and manual review process");
  });

  test("pricing page is linked from both Navbar and Footer", () => {
    assert.ok(fs.existsSync(navbarFile), "Navbar.tsx must exist");
    assert.ok(fs.existsSync(footerFile), "Footer.tsx must exist");

    const navbarContent = fs.readFileSync(navbarFile, "utf-8");
    const footerContent = fs.readFileSync(footerFile, "utf-8");

    assert.match(
      navbarContent,
      /href=["']\/pricing["']/,
      "Navbar.tsx must link to /pricing"
    );
    assert.match(
      footerContent,
      /href=["']\/pricing["']/,
      "Footer.tsx must link to /pricing"
    );
  });

  test("pricing module lib/pricing.ts defines default prices matching page expectation", () => {
    assert.ok(fs.existsSync(pricingModuleFile), "lib/pricing.ts must exist");
    assert.ok(fs.existsSync(apiPricingRouteFile), "app/api/pricing/route.ts must exist");

    const moduleContent = fs.readFileSync(pricingModuleFile, "utf-8");
    assert.match(moduleContent, /PRODUCTS/, "lib/pricing.ts must export PRODUCTS");
    assert.match(moduleContent, /getPrice/, "lib/pricing.ts must export getPrice");
    assert.match(moduleContent, /getProducts/, "lib/pricing.ts must export getProducts");
  });
});
