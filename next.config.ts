import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// --- Bundle Analyzer Setup ---
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// --- Ad-Friendly Headers (Security headers disabled for ads) ---
// All security headers are disabled to ensure ads load properly
// This includes CSP, X-Frame-Options, and other restrictive headers


// --- Next.js Config ---
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.logo.dev",
      },
      {
        protocol: "https",
        hostname: "comprehensiveimplementationstrode.com",
      },
      {
        protocol: "http",
        hostname: "comprehensiveimplementationstrode.com",
      },
      {
        protocol: "https",
        hostname: "*.comprehensiveimplementationstrode.com",
      },
    ],
  },

  experimental: {
    // Add any experimental features here
  },

  // Ad-friendly configurations
  poweredByHeader: false, // Remove X-Powered-By header

  // Ensure external scripts can load
  async rewrites() {
    return [];
  },

  // Allow external domains for ads
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Headers function disabled to allow ads to load without restrictions
  // async headers() {
  //   return [];
  // },
};

// --- Export with Sentry + Bundle Analyzer Wrappers ---
export default withSentryConfig(bundleAnalyzer(nextConfig), {
  org: "waiyanmoeaung",
  project: "nextjs-freevoice",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
