import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

/**
 * Issue #453 — extending an active spotlight.
 *
 * Days purchased while a spotlight is still active must stack onto the current
 * expiry (not restart from now), My Projects must offer "Extend" instead of
 * "Feature", and the owner must be able to see the new expiry.
 */
describe("Extend an active spotlight (#453)", () => {
  const activateRouteFile = path.join(
    webRoot,
    "src",
    "app",
    "api",
    "featured",
    "activate",
    "route.ts",
  );
  const myProjectsFile = path.join(
    webRoot,
    "src",
    "app",
    "my-projects",
    "page.tsx",
  );

  describe("POST /api/featured/activate stacks days onto the current expiry", () => {
    const content = fs.readFileSync(activateRouteFile, "utf-8");

    test("route file exists and reads the stored expiry", () => {
      assert.ok(fs.existsSync(activateRouteFile), "activate route must exist");
      assert.match(
        content,
        /project\.featured_expires_at/,
        "route must read the project's current featured_expires_at",
      );
    });

    test("extends only while the current expiry is still in the future", () => {
      // extended === expiry exists AND is after now
      assert.match(
        content,
        /extended/,
        "route must compute whether the spotlight is being extended",
      );
      assert.match(
        content,
        /getTime\(\)\s*>\s*now\.getTime\(\)/,
        "route must compare the current expiry against now",
      );
    });

    test("adds the purchased days to the base date rather than always starting from now", () => {
      // base = extended ? currentExpiry : now   →   base + days
      assert.match(
        content,
        /const base\s*=\s*extended\s*&&\s*currentExpiry\s*\?\s*currentExpiry\s*:\s*now/,
        "route must stack onto the current expiry when extending",
      );
      assert.match(
        content,
        /base\.getTime\(\)\s*\+\s*days\s*\*\s*86400\s*\*\s*1000/,
        "new expiry must be base + purchased days",
      );
    });

    test("response reports the new expiry so the client can render a receipt", () => {
      assert.match(
        content,
        /expires_at:\s*expiresAt/,
        "response must include the new expiry",
      );
      assert.match(content, /extended,/, "response must report the extended flag");
    });
  });

  describe("My Projects shows 'Extend' while the spotlight is active", () => {
    const content = fs.readFileSync(myProjectsFile, "utf-8");

    test("tracks the spotlight expiry on the project type", () => {
      assert.match(
        content,
        /featured_expires_at\??:\s*string/,
        "Project interface must include featured_expires_at",
      );
    });

    test("treats a spotlight as active only when featured and not yet expired", () => {
      assert.match(
        content,
        /function isSpotlightActive/,
        "page must define isSpotlightActive",
      );
      assert.match(
        content,
        /featured === 1/,
        "active spotlight requires featured === 1",
      );
      assert.match(
        content,
        /getTime\(\)\s*>\s*Date\.now\(\)/,
        "active spotlight requires an expiry in the future",
      );
    });

    test("switches the button label between Feature and Extend", () => {
      assert.match(
        content,
        /isSpotlightActive\(project\)\s*\?\s*"Extend"\s*:\s*"Feature"/,
        "button must show 'Extend' while active and 'Feature' otherwise",
      );
    });

    test("posts to the activate endpoint and surfaces the new expiry as a receipt", () => {
      assert.match(
        content,
        /fetch\("\/api\/featured\/activate"/,
        "page must call the activate endpoint",
      );
      assert.match(content, /expires_at/, "page must read the new expiry from the response");
      assert.match(
        content,
        /new expiry/i,
        "receipt must display the new expiry",
      );
      assert.match(
        content,
        /Spotlight confirmed/,
        "receipt must confirm the extension",
      );
    });

    test("badge shows 'Featured until <date>'", () => {
      assert.match(
        content,
        /Featured\s*\n?\s*\{project\.featured_expires_at/,
        "badge must append the expiry date when present",
      );
      assert.match(content, /until/, "badge text must include 'until'");
    });

    test("shows an error when activation fails", () => {
      assert.match(
        content,
        /spotlightErrors/,
        "page must track per-project activation errors",
      );
      assert.match(
        content,
        /data\.error \|\| /,
        "page must surface the server error message",
      );
    });
  });
});
