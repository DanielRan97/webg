import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

/** Server-side error reporting (see lib/sentry-options.ts). */
export function register() {
  Sentry.init(sentryOptions);
}

/** Errors in server components, route handlers, server actions and the proxy. */
export const onRequestError = Sentry.captureRequestError;
