import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

/**
 * Runs once when the Next.js server starts, before it accepts any requests: turns on server-side error
 * reporting (see lib/sentry-options.ts), then checks the required environment variables (lib/env.ts).
 * This must be the only instrumentation file - Next.js loads just one.
 */
export async function register() {
  Sentry.init(sentryOptions);
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}

/** Errors in server components, route handlers, server actions and the proxy. */
export const onRequestError = Sentry.captureRequestError;
