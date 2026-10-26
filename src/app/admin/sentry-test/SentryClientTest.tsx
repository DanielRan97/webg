"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

/** TEMPORARY (see page.tsx): reports a browser-side test error. */
export function SentryClientTest() {
  const [sent, setSent] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        Sentry.captureException(new Error("WEBG Sentry test: browser error (admin test page)"));
        setSent(true);
      }}
      className="inline-flex min-h-11 items-center rounded-lg border border-ink-200 bg-white px-5 font-semibold text-ink-900 hover:bg-ink-50"
    >
      {sent ? "נשלחה שגיאה מהדפדפן" : "שגיאה בדפדפן"}
    </button>
  );
}
