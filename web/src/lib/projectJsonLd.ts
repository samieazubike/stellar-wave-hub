export interface ProjectMetadataInput {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  logo_url?: string;
  website_url?: string;
  github_url?: string;
}

export interface RatingAveragesInput {
  avg_score?: number | null;
  avg_purpose?: number | null;
  avg_innovation?: number | null;
  avg_usability?: number | null;
  total?: number;
}

export interface SoftwareApplicationJsonLd {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
  image?: string;
  sameAs?: string[];
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    ratingCount: number;
    bestRating: number;
    worstRating: number;
  };
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
}

/**
 * Generates Schema.org SoftwareApplication JSON-LD compliant with Google Rich Results specifications.
 */
export function buildProjectJsonLd(
  project: ProjectMetadataInput,
  averages?: RatingAveragesInput | null,
  siteUrl: string = "https://stellarwavehub.com"
): SoftwareApplicationJsonLd {
  const slug = project.slug || "";
  const canonicalUrl = slug ? `${siteUrl}/projects/${slug}` : siteUrl;

  const schema: SoftwareApplicationJsonLd = {
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

  const sameAs: string[] = [];
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
