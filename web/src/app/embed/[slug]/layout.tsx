import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Bare layout for /embed/[slug] — no Navbar, no Footer, no global
 * chrome. X-Frame-Options for this path is overridden to "ALLOWALL"
 * in next.config.ts so this page can be embedded from any origin.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-transparent m-0 p-0">{children}</body>
    </html>
  );
}
