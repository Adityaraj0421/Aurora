import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Images are pre-optimized to WebP at build-authoring time, so serve them
  // directly instead of routing through the runtime image optimizer. Keeps the
  // demo bulletproof across dev / Cloudflare / Vercel (no ASSETS binding needed).
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
