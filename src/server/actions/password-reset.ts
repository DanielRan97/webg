"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/email";
import { TOKEN_PURPOSE } from "@/lib/constants";
import { generateToken, hashToken } from "@/lib/tokens";
import { invalidateAllSessions } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const NEUTRAL_MESSAGE = "אם קיים חשבון עם כתובת האימייל הזו, שלחנו קישור לאיפוס הסיסמה.";
const BCRYPT_COST = 12;

export interface ForgotPasswordState {
  message?: string;
  error?: string;
}

/**
 * Always returns the same neutral message, whether or not the email
 * belongs to an account - the whole point of this endpoint is to never let
 * someone use it to check which emails have accounts. Only when a matching
 * user exists do we actually create a token and send anything.
 */
export async function requestPasswordResetAction(_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email } = parsed.data;

  const ip = await clientIp();
  const okIp = await rateLimit(`reset-req:ip:${ip}`, RATE_LIMITS.resetRequestPerIp.limit, RATE_LIMITS.resetRequestPerIp.windowMs);
  const okEmail = await rateLimit(`reset-req:email:${email}`, RATE_LIMITS.resetRequestPerEmail.limit, RATE_LIMITS.resetRequestPerEmail.windowMs);

  if (okIp && okEmail) {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      const token = generateToken();
      await db.verificationToken.create({
        data: { userId: user.id, purpose: TOKEN_PURPOSE.PASSWORD_RESET, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      });
      try {
        await sendPasswordResetEmail(user.email, `${appUrl()}/reset-password?token=${token}`);
      } catch (e) {
        console.error("password reset email failed:", e instanceof Error ? e.message : e);
      }
    }
  }
  // Rate-limited or not, found or not: same message, same shape, no timing tell.
  return { message: NEUTRAL_MESSAGE };
}

export interface ResetPasswordState {
  ok?: boolean;
  error?: string;
}

export async function resetPasswordAction(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!token) return { error: "קישור האיפוס לא תקין." };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const record = await db.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.purpose !== TOKEN_PURPOSE.PASSWORD_RESET || record.usedAt || record.expiresAt < new Date()) {
    return { error: "קישור האיפוס פג תוקף או שכבר נעשה בו שימוש. אפשר לבקש קישור חדש." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  // Password just changed: sign out every device, including whoever is mid-use of the old password elsewhere.
  await invalidateAllSessions(record.userId);
  return { ok: true };
}
