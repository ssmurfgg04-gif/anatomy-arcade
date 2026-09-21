import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // clean screenshots / no dev-overlay chrome in captures
  devIndicators: false,
};

export default nextConfig;
