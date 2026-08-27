import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Stellar Wave Hub to discover, submit, and rate Stellar Wave projects.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
