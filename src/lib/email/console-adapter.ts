import "server-only";
import type { EmailAdapter } from "./types";

/**
 * Development fallback: no RESEND_API_KEY configured, so instead of
 * crashing (or silently doing nothing, which is worse - a developer would
 * be stuck unable to test password reset), the email is printed to the
 * server console. The subject and a plain-text body are shown; any link in
 * the text is easy to copy into a browser.
 */
export const consoleAdapter: EmailAdapter = {
  async send({ to, subject, text }) {
    console.log(
      [
        "",
        "———————————————————————————————————————————",
        "  📧  Email (dev mode - no RESEND_API_KEY set)",
        `  To:      ${to}`,
        `  Subject: ${subject}`,
        "———————————————————————————————————————————",
        text,
        "———————————————————————————————————————————",
        "",
      ].join("\n"),
    );
  },
};
