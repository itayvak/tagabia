import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack + Pages Router otherwise loads two @emotion/react instances during SSR
  // (bundled @mui/material vs externalized AppCacheProvider), causing css-* vs muirtl-* hydration mismatches.
  bundlePagesRouterDependencies: true,
};

export default nextConfig;
