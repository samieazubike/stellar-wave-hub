import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

function read(file) {
  assert.ok(
    fs.existsSync(file),
    `Required file is missing: ${path.relative(webRoot, file)}`,
  );
  return fs.readFileSync(file, "utf-8");
}

describe("Sponsored Stories - Database & Migration", () => {
  test("migration file exists with timestamp prefix", () => {
    const migrationsDir = path.join(webRoot, "data", "supabase");
    const files = fs.readdirSync(migrationsDir);
    const storyMigration = files.find(
      (f) => f.includes("create_story_submissions") && f.endsWith(".sql"),
    );
    assert.ok(storyMigration, "Migration creating story_submissions must exist");

    const content = fs.readFileSync(
      path.join(migrationsDir, storyMigration),
      "utf-8",
    );
    assert.match(
      content,
      /create table if not exists public\.story_submissions/i,
      "Migration must create story_submissions table",
    );
    assert.match(content, /project_id/i, "Must contain project_id column");
    assert.match(content, /title/i, "Must contain title column");
    assert.match(content, /body_md/i, "Must contain body_md column");
    assert.match(content, /status/i, "Must contain status column");
    assert.match(content, /tx_hash/i, "Must contain tx_hash column");
    assert.match(
      content,
      /create table if not exists public\.payments/i,
      "Migration must define payments table",
    );
  });

  test("web/src/lib/firebase.ts registers story_submissions and payments", () => {
    const content = read(path.join(webRoot, "src", "lib", "firebase.ts"));
    assert.match(
      content,
      /story_submissions:\s*"story_submissions"/,
      "TABLE_BY_COLLECTION must register story_submissions",
    );
    assert.match(
      content,
      /payments:\s*"payments"/,
      "TABLE_BY_COLLECTION must register payments",
    );
  });
});

describe("Sponsored Stories - Pricing & Payments", () => {
  test("web/src/lib/pricing.ts defines story price with fallback to 60 XLM", () => {
    const pricingFile = path.join(webRoot, "src", "lib", "pricing.ts");
    assert.ok(fs.existsSync(pricingFile), "pricing.ts must exist");
    const content = read(pricingFile);
    assert.match(
      content,
      /NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM/,
      "Must reference NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM",
    );
    assert.match(
      content,
      /60/,
      "Default project story price must be 60 XLM",
    );
    assert.match(
      content,
      /export function getProjectStoryPriceXlm/,
      "Must export getProjectStoryPriceXlm function",
    );
  });

  test("web/src/lib/payments.ts exports verifyStellarPayment with Horizon validation", () => {
    const paymentsFile = path.join(webRoot, "src", "lib", "payments.ts");
    assert.ok(fs.existsSync(paymentsFile), "payments.ts must exist");
    const content = read(paymentsFile);
    assert.match(
      content,
      /export async function verifyStellarPayment/,
      "Must export verifyStellarPayment",
    );
    assert.match(
      content,
      /\/transactions\/\$\{txHash\}/,
      "Must verify transaction on Horizon",
    );
    assert.match(
      content,
      /\/operations/,
      "Must inspect operations on Horizon",
    );
  });

  test("web/src/lib/payments-client.ts exports payWithFreighter", () => {
    const paymentsClientFile = path.join(
      webRoot,
      "src",
      "lib",
      "payments-client.ts",
    );
    assert.ok(
      fs.existsSync(paymentsClientFile),
      "payments-client.ts must exist",
    );
    const content = read(paymentsClientFile);
    assert.match(
      content,
      /export async function payWithFreighter/,
      "Must export payWithFreighter",
    );
    assert.match(
      content,
      /@stellar\/freighter-api/,
      "Must use @stellar/freighter-api",
    );
  });
});

describe("Sponsored Stories - API Routes", () => {
  test("web/src/app/api/stories/route.ts exists and enforces acceptance criteria", () => {
    const routeFile = path.join(webRoot, "src", "app", "api", "stories", "route.ts");
    assert.ok(fs.existsSync(routeFile), "stories/route.ts must exist");
    const content = read(routeFile);

    assert.match(content, /export async function GET/, "Must export GET handler");
    assert.match(content, /export async function POST/, "Must export POST handler");
    assert.match(content, /export async function PATCH/, "Must export PATCH handler");

    // Owner check
    assert.match(
      content,
      /user_id !== auth\.userId/,
      "Must enforce owner-only submission",
    );

    // Duplicate tx_hash redemption check
    assert.match(
      content,
      /\.from\("payments"\)/,
      "Must check payments table for tx_hash",
    );
    assert.match(
      content,
      /already been redeemed/i,
      "Must prevent duplicate tx_hash redemption",
    );

    // Record product = 'project_story'
    assert.match(
      content,
      /product:\s*"project_story"/,
      "Must record payment redemption with product = 'project_story'",
    );

    // Server-side payment verification
    assert.match(
      content,
      /verifyStellarPayment/,
      "Must verify payment server-side",
    );
  });

  test("web/src/app/api/stories/[id]/route.ts exists for admin review", () => {
    const idRouteFile = path.join(
      webRoot,
      "src",
      "app",
      "api",
      "stories",
      "[id]",
      "route.ts",
    );
    assert.ok(fs.existsSync(idRouteFile), "stories/[id]/route.ts must exist");
    const content = read(idRouteFile);
    assert.match(content, /export async function PATCH/, "Must export PATCH handler");
    assert.match(
      content,
      /hasMinRole\(auth\.role,\s*"admin"\)/,
      "Only admin can update story status",
    );
  });
});

describe("Sponsored Stories - Blog Integration & Markdown Parser", () => {
  test("blogs.ts exports parseMarkdownToBlocks and handles story submissions", () => {
    const content = read(path.join(webRoot, "src", "lib", "blogs.ts"));
    assert.match(
      content,
      /export function parseMarkdownToBlocks/,
      "Must export parseMarkdownToBlocks function",
    );
    assert.match(
      content,
      /isSponsored\?: boolean/,
      "BlogPost must support isSponsored",
    );
    assert.match(
      content,
      /\.from\("story_submissions"\)/,
      "getAllBlogs must query story_submissions",
    );
    assert.match(
      content,
      /\.eq\("status",\s*"approved"\)/,
      "Must only show approved story submissions",
    );
  });

  test("/blogs and /blogs/[slug] render Sponsored story label", () => {
    const blogsPageContent = read(path.join(webRoot, "src", "app", "blogs", "page.tsx"));
    assert.match(
      blogsPageContent,
      /Sponsored story/,
      "/blogs page must render 'Sponsored story' label",
    );

    const slugPageContent = read(
      path.join(webRoot, "src", "app", "blogs", "[slug]", "page.tsx"),
    );
    assert.match(
      slugPageContent,
      /Sponsored story/,
      "/blogs/[slug] page must render 'Sponsored story' label",
    );
  });
});

describe("Sponsored Stories - Project Page Owner Submit Flow & Admin Review", () => {
  test("project page has submit form restricted to owner and pay flow", () => {
    const content = read(
      path.join(webRoot, "src", "app", "projects", "[slug]", "page.tsx"),
    );
    assert.match(
      content,
      /isOwner/,
      "Must check isOwner before rendering story submit trigger",
    );
    assert.match(
      content,
      /Submit Story|Submit Sponsored Story/,
      "Must render Submit Story button",
    );
    assert.match(
      content,
      /payWithFreighter/,
      "Must call payWithFreighter on submission",
    );
    assert.match(
      content,
      /\/api\/stories/,
      "Must submit to /api/stories",
    );
  });

  test("admin page includes Stories review tab", () => {
    const content = read(path.join(webRoot, "src", "app", "admin", "page.tsx"));
    assert.match(
      content,
      /<TabsTrigger value="stories">Stories<\/TabsTrigger>/,
      "Admin page must have Stories tab trigger",
    );
    assert.match(
      content,
      /function StoriesTab/,
      "Admin page must define StoriesTab component",
    );
    assert.match(
      content,
      /\/api\/stories/,
      "StoriesTab must fetch from /api/stories",
    );
    assert.match(
      content,
      /Approve/,
      "StoriesTab must have action to approve stories",
    );
  });
});
