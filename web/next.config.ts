import type { NextConfig } from "next";
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — project logos uploaded via /api/upload
        // Matches: https://<project-ref>.supabase.co/storage/v1/object/public/**
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      // Global security headers — apply to every route.
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Embed route — allow framing from any origin.
      // The X-Frame-Options override replaces SAMEORIGIN for this path,
      // and Content-Security-Policy frame-ancestors is the modern equivalent.
      {
        source: "/embed/:path*",
        headers: [
          // Override: browsers honour the last duplicate header value sent;
          // this ALLOWALL wins over the SAMEORIGIN set above for /embed/*.
          { key: "X-Frame-Options", value: "ALLOWALL" },
          // CSP frame-ancestors is the spec-compliant way to allow cross-origin
          // embedding and is respected by modern browsers even when X-Frame-Options
          // says otherwise.
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
