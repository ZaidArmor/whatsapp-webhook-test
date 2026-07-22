import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside a larger repo that has its own lockfile at the root.
  // Pin the Turbopack root here so Next never infers the outer repo as the
  // workspace root (which would pull in the outer project's proxy/middleware).
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
