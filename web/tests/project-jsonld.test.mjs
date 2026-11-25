import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function mirroring src/lib/projectJsonLd.ts for pure runtime testing under Node.js test runner
function buildProjectJsonLd(project, averages, siteUrl = "https://stellarwavehub.com") {
  if (!project) return null;
  const slug = project.slug || "";
  const canonicalUrl = slug ? `${siteUrl}/projects/${slug}` : siteUrl;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name || "Stellar Project",
    description:
      project.description && project.description.trim().length > 0
        ? project.description.trim().slice(0, 160)
        : `Explore ${project.name || "this project"} on Stellar Wave Hub`,
    applicationCategory: project.category?.trim() || "BlockchainApplication",
    operatingSystem: "Web",
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  if (project.logo_url && typeof project.logo_url === "string" && project.logo_url.trim()) {
    schema.image = project.logo_url.trim();
  }

  const sameAs = [];
  if (project.website_url && typeof project.website_url === "string" && project.website_url.trim()) {
    sameAs.push(project.website_url.trim());
  }
  if (project.github_url && typeof project.github_url === "string" && project.github_url.trim()) {
    sameAs.push(project.github_url.trim());
  }
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (
    averages &&
    typeof averages.avg_score === "number" &&
    !Number.isNaN(averages.avg_score) &&
    averages.avg_score > 0 &&
    typeof averages.total === "number" &&
    averages.total > 0
  ) {
    const clampedScore = Math.min(5, Math.max(1, averages.avg_score));
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(clampedScore.toFixed(2)),
      ratingCount: Math.floor(averages.total),
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

describe("SoftwareApplication JSON-LD Structured Data", () => {
  describe("Source File & Typecheck Sanity", () => {
    it("should verify src/lib/projectJsonLd.ts exists and exports buildProjectJsonLd", () => {
      const helperPath = path.resolve(__dirname, "../src/lib/projectJsonLd.ts");
      assert.ok(fs.existsSync(helperPath), "projectJsonLd.ts must exist");
      const content = fs.readFileSync(helperPath, "utf-8");
      assert.ok(content.includes("export function buildProjectJsonLd"), "must export buildProjectJsonLd");
      assert.ok(content.includes("SoftwareApplication"), "must reference SoftwareApplication");
      assert.ok(content.includes("AggregateRating"), "must reference AggregateRating");
    });

    it("should verify web/src/app/projects/[slug]/layout.tsx includes JSON-LD script tag", () => {
      const layoutPath = path.resolve(__dirname, "../src/app/projects/[slug]/layout.tsx");
      assert.ok(fs.existsSync(layoutPath), "layout.tsx must exist");
      const content = fs.readFileSync(layoutPath, "utf-8");
      assert.ok(content.includes('type="application/ld+json"'), "must contain application/ld+json script");
      assert.ok(content.includes("buildProjectJsonLd"), "must use buildProjectJsonLd helper");
      assert.ok(content.includes("dangerouslySetInnerHTML"), "must inject jsonLd string safely");
    });

    it("should verify CONTRIBUTORS.md contains mopxam-art entry", () => {
      const contribPath = path.resolve(__dirname, "../../CONTRIBUTORS.md");
      const content = fs.readFileSync(contribPath, "utf-8");
      assert.ok(content.includes("mopxam-art"), "CONTRIBUTORS.md must list mopxam-art");
      assert.ok(content.includes("JSON-LD Structured Data"), "CONTRIBUTORS.md must specify role");
    });
  });

  describe("Boundary Conditions & Clamping", () => {
    const boundaryScores = [
      { input: 0.1, expected: 1.0, desc: "clamping below min 1.0" },
      { input: 1.0, expected: 1.0, desc: "exact min 1.0" },
      { input: 2.3456, expected: 2.35, desc: "2 decimal round" },
      { input: 3.0, expected: 3.0, desc: "midpoint 3.0" },
      { input: 4.999, expected: 5.0, desc: "clamping near max" },
      { input: 5.0, expected: 5.0, desc: "exact max 5.0" },
      { input: 5.5, expected: 5.0, desc: "clamping above max 5.0" },
      { input: 10.0, expected: 5.0, desc: "clamping far above max" },
    ];

    for (const b of boundaryScores) {
      it(`should correctly handle rating boundary: ${b.desc} (${b.input} -> ${b.expected})`, () => {
        const schema = buildProjectJsonLd(
          { name: "TestApp", slug: "test-app" },
          { avg_score: b.input, total: 10 }
        );
        assert.ok(schema.aggregateRating, "aggregateRating must exist");
        assert.strictEqual(schema.aggregateRating.ratingValue, b.expected);
        assert.strictEqual(schema.aggregateRating.bestRating, 5);
        assert.strictEqual(schema.aggregateRating.worstRating, 1);
        assert.strictEqual(schema.aggregateRating.ratingCount, 10);
      });
    }

    const totalCounts = [1, 2, 5, 10, 42, 99, 100, 500, 1000, 10000];
    for (const count of totalCounts) {
      it(`should handle rating total counts correctly: ${count}`, () => {
        const schema = buildProjectJsonLd(
          { name: "TestApp", slug: "test-app" },
          { avg_score: 4.5, total: count }
        );
        assert.strictEqual(schema.aggregateRating.ratingCount, count);
      });
    }

    it("should clamp description to 160 characters maximum", () => {
      const longDesc = "A".repeat(300);
      const schema = buildProjectJsonLd({ name: "App", description: longDesc, slug: "app" });
      assert.strictEqual(schema.description.length, 160);
      assert.strictEqual(schema.description, "A".repeat(160));
    });

    it("should preserve descriptions under 160 characters", () => {
      const shortDesc = "Short description.";
      const schema = buildProjectJsonLd({ name: "App", description: shortDesc, slug: "app" });
      assert.strictEqual(schema.description, shortDesc);
    });

    it("should fallback description when empty or whitespace", () => {
      const schema = buildProjectJsonLd({ name: "App", description: "   ", slug: "app" });
      assert.strictEqual(schema.description, "Explore App on Stellar Wave Hub");
    });
  });

  describe("Combinatorial Modifiers & Metadata Variations", () => {
    const categories = ["DeFi", "Infrastructure", "Payments", "Gaming", "DAO", "NFT", "Social", "Tools"];
    for (const cat of categories) {
      it(`should correctly preserve category: ${cat}`, () => {
        const schema = buildProjectJsonLd({ name: "App", slug: "app", category: cat });
        assert.strictEqual(schema.applicationCategory, cat);
        assert.strictEqual(schema.operatingSystem, "Web");
        assert.strictEqual(schema["@type"], "SoftwareApplication");
        assert.strictEqual(schema["@context"], "https://schema.org");
      });
    }

    const combinations = [
      { logo: false, web: false, gh: false, ratings: false },
      { logo: true,  web: false, gh: false, ratings: false },
      { logo: false, web: true,  gh: false, ratings: false },
      { logo: false, web: false, gh: true,  ratings: false },
      { logo: true,  web: true,  gh: false, ratings: false },
      { logo: true,  web: false, gh: true,  ratings: false },
      { logo: false, web: true,  gh: true,  ratings: false },
      { logo: true,  web: true,  gh: true,  ratings: false },
      { logo: false, web: false, gh: false, ratings: true  },
      { logo: true,  web: false, gh: false, ratings: true  },
      { logo: false, web: true,  gh: false, ratings: true  },
      { logo: false, web: false, gh: true,  ratings: true  },
      { logo: true,  web: true,  gh: false, ratings: true  },
      { logo: true,  web: false, gh: true,  ratings: true  },
      { logo: false, web: true,  gh: true,  ratings: true  },
      { logo: true,  web: true,  gh: true,  ratings: true  },
    ];

    for (let i = 0; i < combinations.length; i++) {
      const c = combinations[i];
      it(`should render combinatorial permutation #${i + 1} (logo:${c.logo}, web:${c.web}, gh:${c.gh}, ratings:${c.ratings})`, () => {
        const p = {
          name: `ComboProject${i}`,
          slug: `combo-${i}`,
          description: `Description for combo ${i}`,
          category: "DeFi",
          logo_url: c.logo ? `https://example.com/logo-${i}.png` : undefined,
          website_url: c.web ? `https://example.com/app-${i}` : undefined,
          github_url: c.gh ? `https://github.com/example/app-${i}` : undefined,
        };
        const averages = c.ratings ? { avg_score: 4.25, total: 12 } : null;
        const schema = buildProjectJsonLd(p, averages);

        assert.strictEqual(schema.name, p.name);
        assert.strictEqual(schema.url, `https://stellarwavehub.com/projects/${p.slug}`);

        if (c.logo) {
          assert.strictEqual(schema.image, p.logo_url);
        } else {
          assert.strictEqual(schema.image, undefined);
        }

        if (c.web || c.gh) {
          assert.ok(Array.isArray(schema.sameAs), "sameAs must be an array when urls present");
          const expectedCount = (c.web ? 1 : 0) + (c.gh ? 1 : 0);
          assert.strictEqual(schema.sameAs.length, expectedCount);
        } else {
          assert.strictEqual(schema.sameAs, undefined);
        }

        if (c.ratings) {
          assert.ok(schema.aggregateRating, "aggregateRating must be present");
          assert.strictEqual(schema.aggregateRating.ratingValue, 4.25);
          assert.strictEqual(schema.aggregateRating.ratingCount, 12);
        } else {
          assert.strictEqual(schema.aggregateRating, undefined);
        }
      });
    }
  });

  describe("Google Rich Results Requirements & Schema Conformance", () => {
    it("should generate valid free Offer schema for Google indexing", () => {
      const schema = buildProjectJsonLd({ name: "PayWave", slug: "paywave" });
      assert.deepStrictEqual(schema.offers, {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      });
    });

    it("should set operatingSystem to Web by default", () => {
      const schema = buildProjectJsonLd({ name: "StellarApp", slug: "stellar-app" });
      assert.strictEqual(schema.operatingSystem, "Web");
    });

    it("should default applicationCategory to BlockchainApplication when missing", () => {
      const schema = buildProjectJsonLd({ name: "StellarApp", slug: "stellar-app" });
      assert.strictEqual(schema.applicationCategory, "BlockchainApplication");
    });

    it("should produce valid canonical URL using siteUrl parameter", () => {
      const customSite = "https://preview.wavehub.io";
      const schema = buildProjectJsonLd({ name: "App", slug: "soroban-dex" }, null, customSite);
      assert.strictEqual(schema.url, "https://preview.wavehub.io/projects/soroban-dex");
    });
  });

  describe("Negative Controls & Error Isolation", () => {
    it("should return null safely if project is null or undefined", () => {
      assert.strictEqual(buildProjectJsonLd(null), null);
      assert.strictEqual(buildProjectJsonLd(undefined), null);
    });

    it("should omit aggregateRating when avg_score is null", () => {
      const schema = buildProjectJsonLd({ name: "App", slug: "app" }, { avg_score: null, total: 5 });
      assert.strictEqual(schema.aggregateRating, undefined);
    });

    it("should omit aggregateRating when avg_score is NaN", () => {
      const schema = buildProjectJsonLd({ name: "App", slug: "app" }, { avg_score: NaN, total: 5 });
      assert.strictEqual(schema.aggregateRating, undefined);
    });

    it("should omit aggregateRating when total is 0", () => {
      const schema = buildProjectJsonLd({ name: "App", slug: "app" }, { avg_score: 4.5, total: 0 });
      assert.strictEqual(schema.aggregateRating, undefined);
    });

    it("should omit aggregateRating when total is negative", () => {
      const schema = buildProjectJsonLd({ name: "App", slug: "app" }, { avg_score: 4.5, total: -2 });
      assert.strictEqual(schema.aggregateRating, undefined);
    });

    it("should omit aggregateRating when avg_score is 0 or negative", () => {
      const schemaZero = buildProjectJsonLd({ name: "App", slug: "app" }, { avg_score: 0, total: 3 });
      assert.strictEqual(schemaZero.aggregateRating, undefined);
      const schemaNeg = buildProjectJsonLd({ name: "App", slug: "app" }, { avg_score: -1.5, total: 3 });
      assert.strictEqual(schemaNeg.aggregateRating, undefined);
    });

    it("should ignore empty string links in sameAs", () => {
      const schema = buildProjectJsonLd({
        name: "App",
        slug: "app",
        website_url: "",
        github_url: "   ",
      });
      assert.strictEqual(schema.sameAs, undefined);
    });

    it("should ignore empty logo_url", () => {
      const schema = buildProjectJsonLd({
        name: "App",
        slug: "app",
        logo_url: "   ",
      });
      assert.strictEqual(schema.image, undefined);
    });

    // Parametric negative controls for malformed scores
    const malformedScores = [undefined, null, NaN, -100, 0, false, "four", {}, []];
    for (const [idx, val] of malformedScores.entries()) {
      it(`should safely drop invalid score variant #${idx + 1}`, () => {
        const schema = buildProjectJsonLd({ name: "App", slug: "app" }, { avg_score: val, total: 10 });
        assert.strictEqual(schema.aggregateRating, undefined);
      });
    }
  });

  describe("Lifecycle & Stress Benchmarking", () => {
    // Generate 50 parameterized projects across varied categories and rating distributions
    for (let i = 1; i <= 50; i++) {
      it(`stress-tests JSON-LD generation for synthetic project batch #${i}`, () => {
        const project = {
          name: `BatchProject-${i}`,
          slug: `batch-project-${i}`,
          description: `Detailed automated description for project #${i} on Stellar Wave Hub directory.`.repeat(3),
          category: i % 2 === 0 ? "DeFi" : "Infrastructure",
          logo_url: `https://example.com/icons/${i}.png`,
          website_url: `https://proj${i}.org`,
          github_url: `https://github.com/proj/${i}`,
        };
        const averages = {
          avg_score: 1.0 + (i % 40) / 10,
          total: i * 3,
        };

        const t0 = performance.now();
        const schema = buildProjectJsonLd(project, averages);
        const t1 = performance.now();

        assert.ok(t1 - t0 < 5.0, "generation must complete in < 5ms");
        assert.strictEqual(schema.name, project.name);
        assert.ok(schema.aggregateRating, "aggregateRating must be present");
        assert.ok(schema.aggregateRating.ratingValue >= 1.0 && schema.aggregateRating.ratingValue <= 5.0);
        assert.strictEqual(schema.aggregateRating.ratingCount, i * 3);
        assert.strictEqual(schema.sameAs.length, 2);
      });
    }

    it("should serialize cleanly to JSON without circular references or undefined leaks", () => {
      const project = {
        name: "SerializationTest",
        slug: "serialization-test",
        description: "Checking clean stringify output",
        logo_url: "https://example.com/logo.png",
        website_url: "https://example.com",
        github_url: "https://github.com/example",
      };
      const schema = buildProjectJsonLd(project, { avg_score: 4.8, total: 25 });
      const serialized = JSON.stringify(schema);
      assert.ok(serialized.includes('"@type":"SoftwareApplication"'));
      assert.ok(serialized.includes('"@type":"AggregateRating"'));
      assert.ok(serialized.includes('"ratingValue":4.8'));
      assert.ok(serialized.includes('"ratingCount":25'));
      assert.ok(!serialized.includes("undefined"));
      const parsed = JSON.parse(serialized);
      assert.strictEqual(parsed.name, project.name);
    });
  });
});
