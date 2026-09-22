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
  // Same message whether the email is unknown or the password is wrong - never reveal which.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "האימייל או הסיסמה לא נכונים" };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
