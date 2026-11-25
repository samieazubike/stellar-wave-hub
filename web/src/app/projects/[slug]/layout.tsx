import type { Metadata } from "next";
import { buildProjectJsonLd } from "@/lib/projectJsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";
const apiBase = process.env.NEXT_PUBLIC_API_URL || siteUrl;

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const canonical = new URL(`/projects/${slug}`, siteUrl).toString();

  try {
    const res = await fetch(`${apiBase}/api/projects/${slug}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return {
        title: "Project Not Found",
        alternates: { canonical },
      };
    }

    const { project } = await res.json();
    const title = project.name;
    const description =
      project.description?.slice(0, 160) ||
      `Explore ${project.name} on Stellar Wave Hub`;

    // `openGraph.images` / `twitter.images` are intentionally omitted: Next.js
    // attaches the colocated `opengraph-image.tsx` (name, category, rating)
    // to both automatically. Setting them here would override that image.
    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        type: "article",
        title,
        description,
        url: `${siteUrl}/projects/${slug}`,
        siteName: "Stellar Wave Hub",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Stellar Wave Hub",
      alternates: { canonical },
    };
  }
}

export default async function ProjectLayout({ children, params }: Props) {
  const { slug } = await params;
  let jsonLd: ReturnType<typeof buildProjectJsonLd> | null = null;

  try {
    const res = await fetch(`${apiBase}/api/projects/${slug}`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.project) {
        jsonLd = buildProjectJsonLd(
          { ...data.project, slug },
          data.averages,
          siteUrl
        );
      }
    }
  } catch {
    // Graceful fallback if project details cannot be retrieved
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

