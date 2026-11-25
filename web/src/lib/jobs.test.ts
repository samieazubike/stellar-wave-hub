import { describe, expect, it } from "vitest";
import {
  compareJobs,
  createJobSchema,
  formatCompensation,
  isJobActive,
  isJobFeatured,
  updateJobSchema,
  type Job,
} from "./jobs";

const NOW = new Date("2026-11-25T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    project_id: 1,
    posted_by: 1,
    title: "Soroban engineer",
    description: "Build smart contracts for our lending protocol.",
    type: "full_time",
    compensation: null,
    compensation_currency: "USD",
    compensation_period: "year",
    location: null,
    remote: true,
    apply_url: "https://example.com/apply",
    status: "active",
    featured_until: null,
    expires_at: new Date(NOW.getTime() + DAY).toISOString(),
    tx_hash: null,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...overrides,
  };
}

describe("isJobActive", () => {
  it("is true for active jobs that have not expired", () => {
    expect(isJobActive(job(), NOW)).toBe(true);
  });

  it("is false once expires_at has passed", () => {
    expect(isJobActive(job({ expires_at: new Date(NOW.getTime() - 1).toISOString() }), NOW)).toBe(false);
  });

  it("is false for closed jobs", () => {
    expect(isJobActive(job({ status: "closed" }), NOW)).toBe(false);
  });
});

describe("compareJobs", () => {
  it("puts featured jobs first, then newest first", () => {
    const featuredOld = job({
      id: 1,
      featured_until: new Date(NOW.getTime() + DAY).toISOString(),
      created_at: new Date(NOW.getTime() - 5 * DAY).toISOString(),
    });
    const newest = job({ id: 2, created_at: NOW.toISOString() });
    const older = job({ id: 3, created_at: new Date(NOW.getTime() - DAY).toISOString() });
    const expiredFeature = job({
      id: 4,
      featured_until: new Date(NOW.getTime() - DAY).toISOString(),
      created_at: new Date(NOW.getTime() - 2 * DAY).toISOString(),
    });

    const sorted = [older, expiredFeature, newest, featuredOld].sort((a, b) => compareJobs(a, b, NOW));
    expect(sorted.map((j) => j.id)).toEqual([1, 2, 3, 4]);
    expect(isJobFeatured(expiredFeature, NOW)).toBe(false);
  });
});

describe("formatCompensation", () => {
  it("formats USD and XLM amounts", () => {
    expect(formatCompensation(job({ compensation: 120000 }))).toBe("$120,000/yr");
    expect(
      formatCompensation(job({ compensation: 5000, compensation_currency: "XLM", compensation_period: "fixed" })),
    ).toBe("5,000 XLM");
  });

  it("returns null when no compensation is set", () => {
    expect(formatCompensation(job())).toBeNull();
  });
});

describe("createJobSchema", () => {
  const base = {
    project_id: 7,
    title: "Frontend developer",
    description: "Help us ship the wallet dashboard on Stellar.",
    apply_url: "https://example.com/jobs/1",
  };

  it("applies defaults", () => {
    const result = createJobSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("full_time");
      expect(result.data.compensation_currency).toBe("USD");
      expect(result.data.remote).toBe(true);
    }
  });

  it("rejects non-http apply URLs", () => {
    expect(createJobSchema.safeParse({ ...base, apply_url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("rejects expiry dates in the past or too far out", () => {
    const past = new Date(Date.now() - DAY).toISOString();
    const farFuture = new Date(Date.now() + 365 * DAY).toISOString();
    expect(createJobSchema.safeParse({ ...base, expires_at: past }).success).toBe(false);
    expect(createJobSchema.safeParse({ ...base, expires_at: farFuture }).success).toBe(false);
  });
});

describe("updateJobSchema", () => {
  it("rejects unknown fields and empty bodies", () => {
    expect(updateJobSchema.safeParse({ project_id: 3 }).success).toBe(false);
    expect(updateJobSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a status change", () => {
    expect(updateJobSchema.safeParse({ status: "closed" }).success).toBe(true);
  });
});
