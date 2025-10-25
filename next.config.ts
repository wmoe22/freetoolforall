import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// --- Bundle Analyzer Setup ---
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// --- Security Headers ---
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval'
        https://www.googletagmanager.com
        https://www.google-analytics.com
        https://www.highperformanceformat.com
        http://www.highperformanceformat.com
        https://*.adsterra.com
        http://*.adsterra.com
        https://comprehensiveimplementationstrode.com
        http://comprehensiveimplementationstrode.com;
      img-src * data:;
      connect-src *;
      style-src 'self' 'unsafe-inline';
      frame-src *;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
];

// --- Next.js Config ---
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.logo.dev",
      },
    ],
  },

  experimental: {
    // Add any experimental features here
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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
