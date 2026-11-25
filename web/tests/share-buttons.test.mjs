import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

test("ShareButtons component and integration on project pages (#512)", async (t) => {
  await t.test("ShareButtons component file exists", () => {
    assert.ok(
      existsSync(new URL("../src/components/ShareButtons.tsx", import.meta.url)),
      "src/components/ShareButtons.tsx should exist"
    );
  });

  await t.test("ShareButtons component source code includes required share targets and functionality", () => {
    const content = readFileSync(
      new URL("../src/components/ShareButtons.tsx", import.meta.url),
      "utf8"
    );

    // X (Twitter)
    assert.match(
      content,
      /twitter\.com\/intent\/tweet/,
      "Should include X/Twitter share URL"
    );

    // Telegram
    assert.match(
      content,
      /t\.me\/share\/url/,
      "Should include Telegram share URL"
    );

    // LinkedIn
    assert.match(
      content,
      /linkedin\.com\/sharing\/share-offsite/,
      "Should include LinkedIn share URL"
    );

    // Copy link & toast
    assert.match(
      content,
      /navigator\.clipboard\.writeText/,
      "Should support copying link to clipboard"
    );
    assert.match(
      content,
      /toastMessage/,
      "Should expose toast message feedback upon copying"
    );

    // Web Share API
    assert.match(
      content,
      /navigator\.share/,
      "Should support Web Share API when available"
    );
  });

  await t.test("Project page imports and renders ShareButtons", () => {
    const pageContent = readFileSync(
      new URL("../src/app/projects/[slug]/page.tsx", import.meta.url),
      "utf8"
    );

    assert.match(
      pageContent,
      /import ShareButtons from "@\/components\/ShareButtons";/,
      "Project detail page should import ShareButtons"
    );

    assert.match(
      pageContent,
      /<ShareButtons/,
      "Project detail page should render ShareButtons"
    );
  });
});
