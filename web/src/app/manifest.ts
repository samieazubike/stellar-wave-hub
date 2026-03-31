import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stellar Wave Hub",
    short_name: "StellarWave",
    description: "Discover, rate, and track projects built through the Stellar Wave Program",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a1a",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
