import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("Issue #526: Report a project", () => {
  const supabaseDir = path.join(webRoot, "data", "supabase");
  const firebaseFile = path.join(webRoot, "src", "lib", "firebase.ts");
  const schemaFile = path.join(webRoot, "src", "lib", "validation", "schemas", "reports.ts");
  const apiRouteFile = path.join(webRoot, "src", "app", "api", "reports", "route.ts");
  const projectPageFile = path.join(webRoot, "src", "app", "projects", "[slug]", "page.tsx");

  test("should have a timestamped SQL migration creating reports table with required columns and dedupe constraint", () => {
    const files = fs.readdirSync(supabaseDir);
    const migrationFile = files.find((f) => /^\d{12}_.*reports.*\.sql$/.test(f));
    assert.ok(migrationFile, "Migration file matching YYYYMMDDHHMM_*.sql for reports must exist");

    const content = fs.readFileSync(path.join(supabaseDir, migrationFile), "utf-8");
    assert.match(content, /create table if not exists public\.reports/i, "Must create public.reports table");
    assert.match(content, /target_type\s+text/i, "Must include target_type column");
    assert.match(content, /target_id\s+bigint/i, "Must include target_id column");
    assert.match(content, /reporter_id\s+bigint/i, "Must include reporter_id column");
    assert.match(content, /reason\s+text/i, "Must include reason column");
    assert.match(content, /note\s+text/i, "Must include note column");
    assert.match(content, /status\s+text/i, "Must include status column");

    // Acceptance criteria: one open report per user per target
    assert.match(content, /reports_unique_open_user_target_idx/i, "Must define unique index for deduplication");
    assert.match(content, /where\s+status\s*=\s*'open'/i, "Unique index must enforce one open report per user per target");
  });

  test("should register reports table in firebase.ts collection map", () => {
    assert.ok(fs.existsSync(firebaseFile), "firebase.ts must exist");
    const content = fs.readFileSync(firebaseFile, "utf-8");
    assert.match(content, /reports:\s*"reports"/, "TABLE_BY_COLLECTION must include reports");
  });

  test("should define report schema accepting project target, note, and standard reasons", () => {
    assert.ok(fs.existsSync(schemaFile), "schemas/reports.ts must exist");
    const content = fs.readFileSync(schemaFile, "utf-8");

    // Reasons must include spam, scam, wrong info, other
    assert.match(content, /"spam"/, "Must support spam");
    assert.match(content, /"scam"/, "Must support scam");
    assert.match(content, /"wrong_info"|"wrong info"/, "Must support wrong info");
    assert.match(content, /"other"/, "Must support other");

    // Target type must accept project
    assert.match(content, /"project"/, "Schema must accept target_type project");
    assert.match(content, /note/, "Schema must accept note");
  });

  test("should have POST /api/reports with rate limit and dedupe per user/target", () => {
    assert.ok(fs.existsSync(apiRouteFile), "api/reports/route.ts must exist");
    const content = fs.readFileSync(apiRouteFile, "utf-8");

    // Rate limiting
    assert.match(content, /checkRateLimit/, "API route must call checkRateLimit");
    assert.match(content, /rateLimitExceededResponse/, "API route must handle rate limit exceeded");

    // Dedupe check for one open report per user per target
    assert.match(content, /\.where\("status",\s*"==",\s*"open"\)/, "Must query for existing open report");
    assert.match(content, /status:\s*409/, "Must return 409 conflict when duplicate open report exists");

    // Prevent reporting own project/rating
    assert.match(content, /Cannot report your own project/, "Must prevent self-reporting projects");
    assert.match(content, /Cannot report your own review/, "Must prevent self-reporting reviews");

    // Must store note
    assert.match(content, /note:/, "Must save note field");
  });

  test("should have GET /api/reports endpoint to check existing report status", () => {
    const content = fs.readFileSync(apiRouteFile, "utf-8");
    assert.match(content, /export async function GET/, "Must export GET handler");
    assert.match(content, /hasOpenReport/, "GET handler must return hasOpenReport status");
  });

  test("should render Report button and dialog on the project page", () => {
    assert.ok(fs.existsSync(projectPageFile), "projects/[slug]/page.tsx must exist");
    const content = fs.readFileSync(projectPageFile, "utf-8");

    // Report project trigger button
    assert.match(content, /Report project/i, "Project page must render a Report project button");
    assert.match(content, /Reported/i, "Project page must indicate when already reported");

    // Dialog components
    assert.match(content, /<AlertDialog/i, "Must use AlertDialog for reporting");
    assert.match(content, /AlertDialogTitle/i, "Dialog must have a title");
    assert.match(content, /AlertDialogDescription/i, "Dialog must have a description");

    // Form inputs: reasons (spam, scam, wrong info, other) and note
    assert.match(content, /submitProjectReport/i, "Must define submitProjectReport handler");
    assert.match(content, /projectReportReason/i, "Must manage report reason state");
    assert.match(content, /projectReportNote/i, "Must manage report note state");
    assert.match(content, /Textarea/i, "Must use Textarea for the note");
  });
});
