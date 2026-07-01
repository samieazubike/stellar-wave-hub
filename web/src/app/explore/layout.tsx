import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Projects",
  description:
    "Browse and discover innovative projects built on the Stellar network through the Stellar Wave Program.",
  alternates: { canonical: "/explore" },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
