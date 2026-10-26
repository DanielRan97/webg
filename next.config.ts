import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

/**
 * Sentry's build step uploads source maps, so reported errors point at the real line of code. It runs
 * only where SENTRY_AUTH_TOKEN is set (Vercel); the maps are then deleted from the deployment, so they
 * are never served to visitors. Without the token (local builds) nothing is uploaded.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
});
