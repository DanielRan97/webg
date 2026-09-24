"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema, signupSchema } from "@/lib/validation";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { sendVerificationEmailFor } from "./email-verification";

export interface AuthState {
  error?: string;
}

const BCRYPT_COST = 12;

/**
 * A fixed, precomputed bcrypt hash of an arbitrary placeholder - not tied to any
 * real account. Used only so bcrypt.compare() always runs, even when the email
 * does not exist, so an unknown-email attempt and a wrong-password attempt take
 * the same time. Without this, `!user ||` below short-circuits and skips
 * bcrypt entirely for unknown emails, which responds measurably faster than a
 * real account with a wrong password - an account-enumeration timing oracle.
 */
const DUMMY_HASH = "$2b$12$3gL4AH03D.G.ZvODcJxsyeh89omnxTtnpA.MgMr4OXhM.3J4ObsN2";

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  if (!(await rateLimit(`signup:ip:${ip}`, RATE_LIMITS.signupPerIp.limit, RATE_LIMITS.signupPerIp.windowMs))) {
    return { error: "יותר מדי ניסיונות הרשמה. נסו שוב בעוד כמה דקות." };
  }

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "כבר קיים חשבון עם האימייל הזה. אפשר להתחבר." };
  }
  const user = await db.user.create({ data: { email, passwordHash: await bcrypt.hash(password, BCRYPT_COST) } });
  await createSession(user.id);
  // Best-effort: a slow or failed email must never block account creation.
  sendVerificationEmailFor(user.id, user.email).catch((e) => console.error("verification email failed:", e instanceof Error ? e.message : e));
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const okIp = await rateLimit(`login:ip:${ip}`, RATE_LIMITS.loginPerIp.limit, RATE_LIMITS.loginPerIp.windowMs);
  const okEmail = await rateLimit(`login:email:${email}`, RATE_LIMITS.loginPerEmail.limit, RATE_LIMITS.loginPerEmail.windowMs);
  if (!okIp || !okEmail) return { error: "יותר מדי ניסיונות התחברות. נסו שוב בעוד כמה דקות." };

  const user = await db.user.findUnique({ where: { email } });
  // Always compare against something, real hash or dummy, so timing does not
  // reveal whether the email exists (see DUMMY_HASH above).
  const validPassword = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  // Same message whether the email is unknown or the password is wrong - never reveal which.
  if (!user || !validPassword) {
    return { error: "האימייל או הסיסמה לא נכונים" };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
