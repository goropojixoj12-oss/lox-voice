import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Media is served from /public — no remote image hosts.
  images: {},
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
