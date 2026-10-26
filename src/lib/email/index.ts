import "server-only";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { consoleAdapter } from "./console-adapter";
import { createResendAdapter } from "./resend-adapter";
import { billingNoticeEmail, contactCodeEmail, contactFormEmail, leadFormEmail, smsBalanceAlertEmail, passwordResetEmail, supportReplyEmail, supportTicketOpenedEmail, verifyEmailEmail, type BillingNotice } from "./templates";
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

// Account emails get a real Reply-To: the From address (no-reply@) is not a mailbox, so a reply to it would bounce.
// Deliberately not set on contact/lead emails - a business owner hitting "reply" there must not land at WEBG.
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { subject, html, text } = passwordResetEmail(resetUrl);
  await getAdapter().send({ to, subject, html, text, replyTo: SUPPORT_EMAIL });
}

export async function sendVerifyEmail(to: string, verifyUrl: string) {
  const { subject, html, text } = verifyEmailEmail(verifyUrl);
  await getAdapter().send({ to, subject, html, text, replyTo: SUPPORT_EMAIL });
}

/** `to` is the site owner's account email, resolved server-side (server/billing.ts). */
export async function sendBillingNoticeEmail(to: string, kind: BillingNotice, input: { businessName: string; url: string; amount: string; date: string }) {
  const { subject, html, text } = billingNoticeEmail(kind, input);
  await getAdapter().send({ to, subject, html, text, replyTo: SUPPORT_EMAIL });
}

/** `to` must always be resolved server-side from the website's owner - never accept a recipient from the browser. `adminUrl` is null for a Basic-plan site (no inbox to link to). */
export async function sendContactFormEmail(
  to: string,
  input: { businessName: string; siteUrl: string; adminUrl: string | null; name: string; phone: string; email: string; message: string; submittedAt: string },
) {
  const { subject, html, text } = contactFormEmail(input);
  await getAdapter().send({ to, subject, html, text });
}

/** `to` must always be resolved server-side from the website's owner - never accept a recipient from the browser. `adminUrl` is null for a Basic-plan site (no inbox to link to). */
export async function sendLeadFormEmail(
  to: string,
  input: { businessName: string; siteUrl: string; adminUrl: string | null; name: string; phone: string; email: string; submittedAt: string },
) {
  const { subject, html, text } = leadFormEmail(input);
  await getAdapter().send({ to, subject, html, text });
}

/** `to` must always be resolved server-side from the ticket's owner - never accept a recipient from the browser. */
export async function sendSupportReplyEmail(to: string, input: { subject: string; message: string; ticketUrl: string }) {
  const { subject, html, text } = supportReplyEmail(input);
  await getAdapter().send({ to, subject, html, text });
}

/** `to` must always be resolved server-side from ADMIN_EMAILS - never accept a recipient from the browser. Best-effort only: a failure here must never block ticket creation, see callers. */
export async function sendSupportTicketOpenedEmail(to: string, input: { subject: string; category: string; userEmail: string; adminTicketUrl: string }) {
  const { subject, html, text } = supportTicketOpenedEmail(input);
  await getAdapter().send({ to, subject, html, text });
}

// Prepared for later (Stage 4 asked these be ready to add, not built yet):
// export async function sendWelcomeEmail(to: string) { ... }
// export async function sendSubscriptionEmail(to: string, kind: "trial-ending" | "payment-failed" | ...) { ... }

/** The one-time code for verifying a site's contact email. Sent to that address, which the owner typed in themselves. */
export async function sendContactCodeEmail(to: string, code: string, businessName: string) {
  const { subject, html, text } = contactCodeEmail(code, businessName);
  await getAdapter().send({ to, subject, html, text, replyTo: SUPPORT_EMAIL });
}

/** Internal alert to a WEBG admin that SMS credit is low. */
export async function sendSmsBalanceAlert(to: string, left: number) {
  const { subject, html, text } = smsBalanceAlertEmail(left);
  await getAdapter().send({ to, subject, html, text });
}
