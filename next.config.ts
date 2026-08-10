import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep it minimal. No image optimization, no ISR.

  // Deploying a rule compiles Solidity from contracts/ and signs with a local
  // key, neither of which belongs on a read-only serverless filesystem. On a
  // hosted build the confirm step is disabled in the UI and refused by the API.
  env: {
    NEXT_PUBLIC_DEPLOY_FROM_BROWSER: process.env.VERCEL ? "off" : "on",
  },

  // The API routes share the same src/ modules as the CLI scripts, which run
  // under tsx as native ESM and therefore import each other with explicit ".js"
  // specifiers. The bundler must map those back onto the ".ts" files on disk,
  // otherwise every shared import fails to resolve.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },

  // Same mapping for Turbopack, so `next dev --turbopack` behaves identically.
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
  },
};

export default nextConfig;
