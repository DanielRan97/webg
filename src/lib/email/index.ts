import "server-only";
import { consoleAdapter } from "./console-adapter";
import { createResendAdapter } from "./resend-adapter";
import { contactFormEmail, leadFormEmail, passwordResetEmail, verifyEmailEmail } from "./templates";
import type { EmailAdapter } from "./types";

/**
 * Provider is chosen once, by whether RESEND_API_KEY is set. Swapping
 * providers later means adding one more file next to resend-adapter.ts and
 * changing this one line - nothing else in the app talks to Resend directly.
 */
function getAdapter(): EmailAdapter {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return consoleAdapter;
  return createResendAdapter(apiKey, process.env.EMAIL_FROM ?? "WEBG <no-reply@webg.co.il>");
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { subject, html, text } = passwordResetEmail(resetUrl);
  await getAdapter().send({ to, subject, html, text });
}

export async function sendVerifyEmail(to: string, verifyUrl: string) {
  const { subject, html, text } = verifyEmailEmail(verifyUrl);
  await getAdapter().send({ to, subject, html, text });
}

/** `to` must always be resolved server-side from the website's owner - never accept a recipient from the browser. */
export async function sendContactFormEmail(
  to: string,
  input: { businessName: string; siteUrl: string; name: string; phone: string; email: string; message: string; submittedAt: string },
) {
  const { subject, html, text } = contactFormEmail(input);
  await getAdapter().send({ to, subject, html, text });
}

/** `to` must always be resolved server-side from the website's owner - never accept a recipient from the browser. */
export async function sendLeadFormEmail(
  to: string,
  input: { businessName: string; siteUrl: string; name: string; phone: string; email: string; submittedAt: string },
) {
  const { subject, html, text } = leadFormEmail(input);
  await getAdapter().send({ to, subject, html, text });
}

// Prepared for later (Stage 4 asked these be ready to add, not built yet):
// export async function sendWelcomeEmail(to: string) { ... }
// export async function sendSubscriptionEmail(to: string, kind: "trial-ending" | "payment-failed" | ...) { ... }
