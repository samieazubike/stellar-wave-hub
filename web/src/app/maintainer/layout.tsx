import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintainer Dashboard | Stellar Wave Hub",
  description:
    "Maintainer moderation hub for reviewing submissions, tracking approvals, and managing Stellar Wave ecosystem projects.",
  alternates: { canonical: "/maintainer" },
};

export default function MaintainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
