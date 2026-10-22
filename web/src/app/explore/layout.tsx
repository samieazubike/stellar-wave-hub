import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

export const metadata: Metadata = {
  title: "Explore Projects",
  description:
    "Browse and discover innovative projects built on the Stellar network through the Stellar Wave Program.",
  alternates: { canonical: new URL("/explore", siteUrl).toString() },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
