import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["172.20.10.3"],
  // Turbopack + Pages Router otherwise loads two @emotion/react instances during SSR
  // (bundled @mui/material vs externalized AppCacheProvider), causing css-* vs muirtl-* hydration mismatches.
  bundlePagesRouterDependencies: true,
  // Firebase Admin SDK uses native gRPC bindings that cannot be bundled
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "google-gax",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
