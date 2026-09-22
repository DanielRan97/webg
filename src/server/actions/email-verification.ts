"use server";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { sendVerifyEmail } from "@/lib/email";
import { TOKEN_PURPOSE } from "@/lib/constants";
import { generateToken, hashToken } from "@/lib/tokens";
import { requireUser } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Issues a fresh verification token and emails it. Called right after
 * signup, and again from the "resend" button. Any older, still-unused
 * EMAIL_VERIFY tokens for this user are marked used first, so only the
 * newest link works (avoids a confusing "which email do I use" situation).
 */
export async function sendVerificationEmailFor(userId: string, email: string) {
  await db.verificationToken.updateMany({
    where: { userId, purpose: TOKEN_PURPOSE.EMAIL_VERIFY, usedAt: null },
    data: { usedAt: new Date() },
  });
  const token = generateToken();
  await db.verificationToken.create({
    data: { userId, purpose: TOKEN_PURPOSE.EMAIL_VERIFY, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
  });
  await sendVerifyEmail(email, `${appUrl()}/verify-email?token=${token}`);
}

export interface SimpleState {
  ok?: boolean;
  error?: string;
}

/** For the "שלח שוב" button on the dashboard banner. */
export async function resendVerificationAction(): Promise<SimpleState> {
  const user = await requireUser();
  if (user.emailVerifiedAt) return { ok: true };
  if (!(await rateLimit(`verify-resend:user:${user.id}`, RATE_LIMITS.resendVerifyPerUser.limit, RATE_LIMITS.resendVerifyPerUser.windowMs))) {
    return { error: "כבר שלחנו קישור לאחרונה. בדקו את תיבת הדואר (וגם את תיקיית הספאם)." };
  }
  try {
    await sendVerificationEmailFor(user.id, user.email);
    return { ok: true };
  } catch (e) {
    console.error("resend verification failed:", e instanceof Error ? e.message : e);
    return { error: "לא הצלחנו לשלוח את המייל. נסו שוב בעוד רגע." };
  }
}

/**
 * The /verify-email page renders a button rather than consuming the token
 * on page load. Some corporate mail scanners "click" links in emails
 * automatically to check them for safety, before a real person ever opens
 * the message; if a plain GET consumed a single-use token, that automated
 * visit would burn it and the real user would hit "link already used".
 * Requiring an explicit form submit (a POST, never auto-followed by a
 * scanner) avoids that. Password reset already works this way - the GET
 * only shows a form, and resetPasswordAction only runs on submit.
 */
export async function confirmVerifyEmailAction(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "קישור האימות לא תקין." };
  const record = await db.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.purpose !== TOKEN_PURPOSE.EMAIL_VERIFY || record.usedAt || record.expiresAt < new Date()) {
    return { error: "קישור האימות פג תוקף או שכבר נעשה בו שימוש. אפשר לבקש קישור חדש מהלוח שלכם." };
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true };
}
