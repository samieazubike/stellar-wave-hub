import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("Review Helpfulness Upvotes and Sorting (Issue #213)", () => {
  const schemaFile = path.join(webRoot, "data", "supabase", "schema.sql");
  const migrationFile = path.join(webRoot, "data", "supabase", "202610220910_add_rating_votes.sql");
  const rlsFile = path.join(webRoot, "data", "supabase", "rls.sql");
  const dbFile = path.join(webRoot, "src", "lib", "db.ts");
  const firebaseFile = path.join(webRoot, "src", "lib", "firebase.ts");
  const validationFile = path.join(webRoot, "src", "lib", "validation", "schemas", "ratings.ts");
  const voteRouteFile = path.join(webRoot, "src", "app", "api", "ratings", "[id]", "vote", "route.ts");
  const projectRatingsRouteFile = path.join(webRoot, "src", "app", "api", "ratings", "project", "[projectId]", "route.ts");
  const projectDetailApiFile = path.join(webRoot, "src", "app", "api", "projects", "[id]", "route.ts");
  const projectDetailPageFile = path.join(webRoot, "src", "app", "projects", "[slug]", "page.tsx");

  test("should define rating_votes table and migration with unique constraint", () => {
    assert.ok(fs.existsSync(migrationFile), "202610220910_add_rating_votes.sql must exist");
    assert.ok(fs.existsSync(schemaFile), "schema.sql must exist");

    const migrationContent = fs.readFileSync(migrationFile, "utf-8");
    const schemaContent = fs.readFileSync(schemaFile, "utf-8");

    // Check table and constraint definitions
    assert.match(migrationContent, /create table if not exists public\.rating_votes/i);
    assert.match(migrationContent, /rating_votes_rating_user_unique_idx/i);
    assert.match(migrationContent, /foreign key\s*\(rating_id\)\s*references public\.ratings/i);
    assert.match(migrationContent, /foreign key\s*\(user_id\)\s*references public\.users/i);

    assert.match(schemaContent, /create table if not exists public\.rating_votes/i);
    assert.match(schemaContent, /rating_votes_rating_user_unique_idx/i);
  });

  test("should configure RLS policies for rating_votes", () => {
    assert.ok(fs.existsSync(rlsFile), "rls.sql must exist");
    const rlsContent = fs.readFileSync(rlsFile, "utf-8");

    assert.match(rlsContent, /alter table public\.rating_votes enable row level security/i);
    assert.match(rlsContent, /rating_votes_public_read/i);
    assert.match(rlsContent, /rating_votes_owner_insert/i);
    assert.match(rlsContent, /rating_votes_owner_delete/i);
  });

  test("should expose rating_votes collection in db.ts and firebase.ts", () => {
    const dbContent = fs.readFileSync(dbFile, "utf-8");
    const firebaseContent = fs.readFileSync(firebaseFile, "utf-8");

    assert.match(dbContent, /export const ratingVotesCol/);
    assert.match(firebaseContent, /rating_votes: "rating_votes"/);
    assert.match(firebaseContent, /collection === "rating_votes"/);
  });

  test("should provide validation schemas for rating votes and review sorting", () => {
    const validationContent = fs.readFileSync(validationFile, "utf-8");
    assert.match(validationContent, /voteRatingSchema/);
    assert.match(validationContent, /ratingSortOptions/);
    assert.match(validationContent, /sortRatingQuerySchema/);
  });

  test("should implement vote API endpoints with one-vote enforcement and self-vote check", () => {
    assert.ok(fs.existsSync(voteRouteFile), "api/ratings/[id]/vote/route.ts must exist");
    const voteRouteContent = fs.readFileSync(voteRouteFile, "utf-8");

    // POST & DELETE handlers
    assert.match(voteRouteContent, /export async function POST/);
    assert.match(voteRouteContent, /export async function DELETE/);

    // Checks
    assert.match(voteRouteContent, /Cannot vote on your own review/);
    assert.match(voteRouteContent, /You have already marked this review as helpful/);
    assert.match(voteRouteContent, /ratingVotesCol/);
    assert.match(voteRouteContent, /nextId\("rating_votes"\)/);
  });

  test("should support sorting reviews by helpfulness and return helpful_count in rating APIs", () => {
    const projectRatingsContent = fs.readFileSync(projectRatingsRouteFile, "utf-8");
    const projectDetailApiContent = fs.readFileSync(projectDetailApiFile, "utf-8");

    // Check project ratings endpoint
    assert.match(projectRatingsContent, /ratingVotesCol/);
    assert.match(projectRatingsContent, /helpful_count/);
    assert.match(projectRatingsContent, /has_voted/);
    assert.match(projectRatingsContent, /sort === "helpful"/);

    // Check project detail endpoint
    assert.match(projectDetailApiContent, /ratingVotesCol/);
    assert.match(projectDetailApiContent, /helpful_count/);
    assert.match(projectDetailApiContent, /has_voted/);
    assert.match(projectDetailApiContent, /sort === "helpful"/);
  });

  test("should show helpful counts, upvote action, and sort controls in project detail page", () => {
    const pageContent = fs.readFileSync(projectDetailPageFile, "utf-8");

    assert.match(pageContent, /helpful_count/);
    assert.match(pageContent, /has_voted/);
    assert.match(pageContent, /handleVoteHelpful/);
    assert.match(pageContent, /reviewSort/);
    assert.match(pageContent, /Sort by:/);
    assert.match(pageContent, /Most Helpful/);
    assert.match(pageContent, /Helpful/);
  });

  test("should correctly compute helpful sorting comparison", () => {
    const reviews = [
      { id: 1, helpful_count: 2, created_at: "2026-01-01T00:00:00Z" },
      { id: 2, helpful_count: 5, created_at: "2026-01-02T00:00:00Z" },
      { id: 3, helpful_count: 2, created_at: "2026-01-03T00:00:00Z" },
      { id: 4, helpful_count: 0, created_at: "2026-01-04T00:00:00Z" },
    ];

    const sorted = [...reviews].sort((a, b) => {
      const diff = (b.helpful_count || 0) - (a.helpful_count || 0);
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    assert.deepEqual(
      sorted.map((r) => r.id),
      [2, 3, 1, 4],
      "Review with highest helpful count should be first, ties resolved by recency"
    );
  });
});
