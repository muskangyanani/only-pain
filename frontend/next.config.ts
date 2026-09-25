import type { NextConfig } from "next";

// In production the API is proxied under the same origin (/api/* -> BACKEND_URL)
// so auth cookies stay first-party and no CORS is involved.
import { backendUrl } from "./src/lib/server-env";

const BACKEND_URL = backendUrl();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output lets the Dockerfile ship a tiny runtime image. Vercel uses its own
  // output format, so skip it there.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
