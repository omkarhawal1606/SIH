import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "chart.js"],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
