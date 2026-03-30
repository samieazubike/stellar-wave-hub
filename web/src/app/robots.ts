import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/profile", "/my-projects"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
