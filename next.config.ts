import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The simulate scripts build into their own folder so they never clash with a running `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
