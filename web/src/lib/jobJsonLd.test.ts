import { describe, expect, it } from "vitest";
import { buildJobPostingJsonLd, serializeJsonLd } from "./jobJsonLd";
import type { Job } from "./jobs";

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: 42,
    project_id: 7,
    posted_by: 3,
    title: "Soroban engineer",
    description: "Build contracts.\n\nShip <fast>.",
    type: "full_time",
    compensation: 150000,
    compensation_currency: "USD",
    compensation_period: "year",
    location: null,
    remote: true,
    apply_url: "https://example.com/apply",
    status: "active",
    featured_until: null,
    expires_at: "2026-12-25T00:00:00.000Z",
    tx_hash: null,
    created_at: "2026-11-25T00:00:00.000Z",
    updated_at: "2026-11-25T00:00:00.000Z",
    project: {
      id: 7,
      name: "Lumen Lend",
      slug: "lumen-lend",
      category: "defi",
      logo_url: "https://example.com/logo.png",
      website_url: "https://lumenlend.example",
    },
    ...overrides,
  };
}

describe("buildJobPostingJsonLd", () => {
  it("includes the fields Google requires", () => {
    const schema = buildJobPostingJsonLd(job(), "https://hub.test");
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Soroban engineer",
      datePosted: "2026-11-25T00:00:00.000Z",
      validThrough: "2026-12-25T00:00:00.000Z",
      employmentType: "FULL_TIME",
      url: "https://hub.test/jobs/42",
      hiringOrganization: {
        "@type": "Organization",
        name: "Lumen Lend",
        sameAs: "https://lumenlend.example",
        logo: "https://example.com/logo.png",
      },
      jobLocationType: "TELECOMMUTE",
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: { "@type": "QuantitativeValue", value: 150000, unitText: "YEAR" },
      },
    });
  });

  it("escapes HTML in the description", () => {
    const schema = buildJobPostingJsonLd(job());
    expect(schema.description).toBe("<p>Build contracts.</p><p>Ship &lt;fast&gt;.</p>");
  });

  it("uses jobLocation for on-site roles", () => {
    const schema = buildJobPostingJsonLd(job({ remote: false, location: "Lagos" }));
    expect(schema.jobLocationType).toBeUndefined();
    expect(schema.jobLocation).toEqual({
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: "Lagos" },
    });
  });

  it("omits baseSalary for XLM compensation", () => {
    const schema = buildJobPostingJsonLd(job({ compensation_currency: "XLM" }));
    expect(schema.baseSalary).toBeUndefined();
  });
});

describe("serializeJsonLd", () => {
  it("prevents closing the script tag", () => {
    expect(serializeJsonLd({ x: "</script>" })).not.toContain("</script>");
  });
});
