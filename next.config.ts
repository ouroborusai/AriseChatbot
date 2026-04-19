import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Adding empty turbopack config to silence the error as suggested by Next.js
  experimental: {
    // turbopack: {} // This might not be enough if Serwist injects webpack config
  }
};

export default withSerwist(nextConfig);
