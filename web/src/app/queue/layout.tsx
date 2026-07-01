import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Queue",
  description:
    "View all pending projects awaiting approval on Stellar Wave Hub.",
  alternates: { canonical: "/queue" },
};

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
