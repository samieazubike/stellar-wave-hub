import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Project",
  description:
    "Submit your Stellar Wave project for review and listing on Stellar Wave Hub.",
  alternates: { canonical: "/submit" },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
