import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Error reporting to Sentry, shared by the server (instrumentation.ts) and the browser
 * (instrumentation-client.ts). Off unless NEXT_PUBLIC_SENTRY_DSN is set - it is set only on Vercel, so
 * local development never reports. Errors only: no performance tracing and no session replay.
 *
 * Privacy: owners' and their customers' details (emails, phones, form contents) must never reach Sentry.
 * Since SDK v11 the SDK collects user info (IP), cookies, headers, request bodies, query strings and
 * stack-frame variables unless `dataCollection` turns each off - all of it is off here. beforeSend is a
 * second layer: it drops the same fields again and blanks anything shaped like an email or a phone number.
 */
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

const EMAIL = /[^\s@"'<>]+@[^\s@"'<>]+\.[a-z]{2,}/gi;
const PHONE = /(?:\+?972[\s-]?|0)(?:[\s-]?\d){8,9}/g;

export function scrub(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    delete event.request.headers;
    if (event.request.url) event.request.url = scrub(event.request.url.split("?")[0]);
  }
  delete event.user;
  if (event.message) event.message = scrub(event.message);
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = scrub(ex.value);
  }
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = scrub(crumb.message);
    delete crumb.data;
  }
  return event;
}

export const sentryOptions = {
  dsn: DSN,
  enabled: Boolean(DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? "development",
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
    databaseQueryData: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    mcp: { inputs: false, outputs: false },
  },
  tracesSampleRate: 0,
  // A visitor left before the page finished streaming - not a fault, and it would flood the issue list.
  ignoreErrors: ["The destination stream closed early"],
  beforeSend: scrubEvent,
};
