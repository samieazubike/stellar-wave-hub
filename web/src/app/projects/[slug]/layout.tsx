import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";
const apiBase = process.env.NEXT_PUBLIC_API_URL || siteUrl;

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${apiBase}/api/projects/${slug}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return { title: "Project Not Found" };
    }

    const { project } = await res.json();
    const title = project.name;
    const description =
      project.description?.slice(0, 160) ||
      `Explore ${project.name} on Stellar Wave Hub`;

    return {
      title,
      description,
      alternates: {
        canonical: `/projects/${slug}`,
      },
      openGraph: {
        type: "article",
        title,
        description,
        url: `${siteUrl}/projects/${slug}`,
        siteName: "Stellar Wave Hub",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return { title: "Stellar Wave Hub" };
  }
}

export default function ProjectLayout({ children }: Props) {
  return children;
}
