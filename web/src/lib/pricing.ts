/**
 * Single source of truth for every paid product: price, duration and memo
 * prefix. Paid features and `GET /api/pricing` read prices from here.
 *
 * Prices come from env with defaults. Each env var is read by its literal
 * name (never `process.env[name]`) so Next.js can inline the
 * `NEXT_PUBLIC_*` values into client bundles too.
 */
import { getFeaturedTiers, xlmToStroops, type FeaturedTier } from "./featured-pricing";

export const PRODUCT_IDS = [
  "spotlight",
  "category_sponsor",
  "hero_sponsor",
  "priority_review",
  "project_story",
  "pro",
  "job_post",
  "api_pro",
] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

/** A product id; plain strings are accepted (e.g. from a request) and checked at runtime. */
type ProductKey = ProductId | (string & {});

export interface Product {
  id: ProductId;
  label: string;
  /** Price in XLM. For `spotlight` this is the default (30-day) tier. */
  priceXlm: number;
  /** How long one purchase lasts, in days. `null` means a one-off purchase. */
  durationDays: number | null;
  /** First segment of the payment's text memo, e.g. `hero` in `hero:2026-11-23`. */
  memoPrefix: string;
  /** Spotlight only: every duration tier the buyer can pick. */
  tiers?: FeaturedTier[];
}

interface ProductDefinition {
  label: string;
  durationDays: number | null;
  memoPrefix: string;
  defaultPriceXlm: number;
  envVar: string;
  readEnv: () => string | undefined;
}

/** Stellar text memos are limited to 28 bytes. */
export const MAX_MEMO_BYTES = 28;

const SPOTLIGHT_DEFAULT_DAYS = 30;

// `spotlight` is tiered and is priced from NEXT_PUBLIC_FEATURED_TIERS
// (see featured-pricing.ts), so it has no entry here.
const FLAT_PRICED: Record<Exclude<ProductId, "spotlight">, ProductDefinition> = {
  category_sponsor: {
    label: "Category sponsor (1 week)",
    durationDays: 7,
    memoPrefix: "cat",
    defaultPriceXlm: 40,
    envVar: "NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM",
    readEnv: () => process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM,
  },
  hero_sponsor: {
    label: "Homepage hero sponsor (1 week)",
    durationDays: 7,
    memoPrefix: "hero",
    defaultPriceXlm: 150,
    envVar: "NEXT_PUBLIC_PRICE_HERO_SPONSOR_XLM",
    readEnv: () => process.env.NEXT_PUBLIC_PRICE_HERO_SPONSOR_XLM,
  },
  priority_review: {
    label: "Priority review",
    durationDays: null,
    memoPrefix: "prio",
    defaultPriceXlm: 20,
    envVar: "NEXT_PUBLIC_PRICE_PRIORITY_REVIEW_XLM",
    readEnv: () => process.env.NEXT_PUBLIC_PRICE_PRIORITY_REVIEW_XLM,
  },
  project_story: {
    label: "Sponsored project story",
    durationDays: null,
    memoPrefix: "story",
    defaultPriceXlm: 60,
    envVar: "NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM",
    readEnv: () => process.env.NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM,
  },
  pro: {
    label: "Pro project (1 year)",
    durationDays: 365,
    memoPrefix: "pro",
    defaultPriceXlm: 200,
    envVar: "NEXT_PUBLIC_PRICE_PRO_YEAR_XLM",
    readEnv: () => process.env.NEXT_PUBLIC_PRICE_PRO_YEAR_XLM,
  },
  job_post: {
    label: "Job post (30 days)",
    durationDays: 30,
    memoPrefix: "job",
    defaultPriceXlm: 30,
    envVar: "NEXT_PUBLIC_PRICE_JOB_POST_XLM",
    readEnv: () => process.env.NEXT_PUBLIC_PRICE_JOB_POST_XLM,
  },
  api_pro: {
    label: "API Pro key (30 days)",
    durationDays: 30,
    memoPrefix: "api",
    defaultPriceXlm: 25,
    envVar: "NEXT_PUBLIC_PRICE_API_PRO_MONTH_XLM",
    readEnv: () => process.env.NEXT_PUBLIC_PRICE_API_PRO_MONTH_XLM,
  },
};

export function isProductId(value: string): value is ProductId {
  return (PRODUCT_IDS as readonly string[]).includes(value);
}

function assertProductId(product: string): asserts product is ProductId {
  if (!isProductId(product)) throw new Error(`Unknown product: ${product}`);
}

/**
 * Parse a price env value. Unset or blank uses the default. A value that is
 * set but invalid throws: a typo in a price should fail loudly rather than
 * silently charge a different amount.
 */
function parsePrice(def: ProductDefinition): number {
  const raw = def.readEnv()?.trim();
  if (!raw) return def.defaultPriceXlm;

  let stroops: bigint;
  try {
    stroops = xlmToStroops(raw);
  } catch {
    throw new Error(`${def.envVar} must be a positive XLM amount with at most 7 decimals`);
  }
  if (stroops <= BigInt(0)) {
    throw new Error(`${def.envVar} must be a positive XLM amount with at most 7 decimals`);
  }
  return Number(raw);
}

/** Full definition of one product, with its price resolved from env. Throws for unknown products. */
export function getProduct(product: ProductKey): Product {
  assertProductId(product);

  if (product === "spotlight") {
    const tiers = getSpotlightTiers();
    const defaultTier = tiers.find((tier) => tier.days === SPOTLIGHT_DEFAULT_DAYS) ?? tiers[0];
    return {
      id: product,
      label: "Featured spotlight",
      priceXlm: defaultTier.priceXlm,
      durationDays: defaultTier.days,
      memoPrefix: "spotlight",
      tiers,
    };
  }

  const def = FLAT_PRICED[product];
  return {
    id: product,
    label: def.label,
    priceXlm: parsePrice(def),
    durationDays: def.durationDays,
    memoPrefix: def.memoPrefix,
  };
}

/** Price of a product in XLM. Throws for unknown products. */
export function getPrice(product: ProductKey): number {
  return getProduct(product).priceXlm;
}

/** Every product, keyed by id, with prices resolved from env. */
export function getProducts(): Record<ProductId, Product> {
  return Object.fromEntries(PRODUCT_IDS.map((id) => [id, getProduct(id)])) as Record<
    ProductId,
    Product
  >;
}

/**
 * Build the text memo for a payment: the product's prefix followed by the
 * parts, joined with `:`, e.g. `buildMemo("category_sponsor", "defi", 42)`
 * gives `cat:defi:42`. Throws if the result is over Stellar's 28-byte limit.
 */
export function buildMemo(product: ProductId, ...parts: Array<string | number>): string {
  const memo = [getMemoPrefix(product), ...parts].join(":");
  if (new TextEncoder().encode(memo).length > MAX_MEMO_BYTES) {
    throw new Error(`Memo "${memo}" is longer than ${MAX_MEMO_BYTES} bytes`);
  }
  return memo;
}

function getMemoPrefix(product: string): string {
  assertProductId(product);
  return product === "spotlight" ? "spotlight" : FLAT_PRICED[product].memoPrefix;
}

/** Spotlight duration tiers (7 / 30 / 90 days), from NEXT_PUBLIC_FEATURED_TIERS. */
export function getSpotlightTiers(): FeaturedTier[] {
  return getFeaturedTiers();
}
