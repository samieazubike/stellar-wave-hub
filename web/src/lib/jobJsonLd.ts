import type { Job, JobType } from "./jobs";

// Schema.org JobPosting for Google Jobs:
// https://developers.google.com/search/docs/appearance/structured-data/job-posting

const EMPLOYMENT_TYPE: Record<JobType, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
  bounty: "OTHER",
};

const UNIT_TEXT = {
  hour: "HOUR",
  month: "MONTH",
  year: "YEAR",
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-text description → minimal HTML, which Google accepts in `description`. */
function descriptionHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function buildJobPostingJsonLd(job: Job, siteUrl = "https://stellarwavehub.com") {
  const project = job.project;
  const organizationUrl =
    project?.website_url || (project?.slug ? `${siteUrl}/projects/${project.slug}` : siteUrl);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: descriptionHtml(job.description),
    identifier: {
      "@type": "PropertyValue",
      name: project?.name ?? "Stellar Wave Hub",
      value: String(job.id),
    },
    datePosted: job.created_at,
    validThrough: job.expires_at,
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "OTHER",
    url: `${siteUrl}/jobs/${job.id}`,
    directApply: false,
    hiringOrganization: {
      "@type": "Organization",
      name: project?.name ?? "Unknown project",
      sameAs: organizationUrl,
      ...(project?.logo_url ? { logo: project.logo_url } : {}),
    },
  };

  if (job.remote) {
    schema.jobLocationType = "TELECOMMUTE";
    // Google requires at least one applicant location for remote roles.
    schema.applicantLocationRequirements = {
      "@type": "Country",
      name: job.location?.trim() || "Worldwide",
    };
  } else if (job.location) {
    schema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    };
  }

  // Google expects an ISO 4217 currency, so salaries paid in XLM are left out.
  if (
    job.compensation != null &&
    job.compensation_currency === "USD" &&
    job.compensation_period !== "fixed"
  ) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        value: job.compensation,
        unitText: UNIT_TEXT[job.compensation_period],
      },
    };
  }

  return schema;
}

/**
 * Serialize JSON-LD for a <script> tag. `<` is escaped so user content such
 * as "</script>" can't break out of the tag.
 */
export function serializeJsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
