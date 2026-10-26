import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

/** Browser-side error reporting (see lib/sentry-options.ts). */
Sentry.init(sentryOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
