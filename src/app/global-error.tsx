"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort screen for an error nothing else caught (it replaces the root layout, so it brings its
 * own <html>). Reports the error to Sentry and offers a retry.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // An error with a digest came from the server, which already reported it with the real message
    // (instrumentation.ts) - the browser only gets a generic copy, so don't report it twice.
    if (!error.digest) Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body className="min-h-full font-sans">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 py-16 text-center text-ink-900">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">משהו השתבש</h1>
          <p className="max-w-md text-ink-700">קרתה שגיאה לא צפויה, וקיבלנו עליה דיווח. אפשר לנסות שוב, ואם זה חוזר - לחזור לדף הבית.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 font-semibold text-white transition hover:bg-brand-700">
              לנסות שוב
            </button>
            {/* A plain link on purpose: the app's router may be what broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="inline-flex min-h-11 items-center rounded-lg border border-ink-200 bg-white px-5 font-semibold text-ink-900 transition hover:bg-ink-50">
              לדף הבית
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
