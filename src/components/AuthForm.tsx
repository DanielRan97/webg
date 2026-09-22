"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { AuthState } from "@/server/actions/auth";
import { Button, Field, Notice, ValidationContext, inputClass } from "./ui/ui";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isLogin = mode === "login";

  const emailError = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "נא לכתוב כתובת אימייל תקינה. לדוגמה: name@gmail.com" : undefined;
  const passwordError =
    password.length === 0 ? "נא לכתוב סיסמה." : !isLogin && password.length < 8 ? "הסיסמה צריכה להכיל לפחות 8 תווים." : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-gray-300 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex min-h-11 items-center text-3xl font-extrabold text-indigo-700">WEBG</Link>
          <h1 className="mt-2 text-2xl font-bold">{isLogin ? "ברוכים השבים" : "יוצרים חשבון"}</h1>
          <p className="text-gray-700">{isLogin ? "התחברו כדי לראות את האתרים שלכם." : "כמה שניות ואפשר להתחיל. בלי כרטיס אשראי."}</p>
        </div>
        <ValidationContext.Provider value={{ submitted }}>
          <form
            action={formAction}
            noValidate
            onSubmit={(e) => {
              setSubmitted(true);
              if (emailError || passwordError) e.preventDefault();
            }}
            className="space-y-4"
          >
            <Field label="אימייל" hint={isLogin ? undefined : "עם האימייל הזה תתחברו בפעם הבאה."} error={emailError}>
              {(p) => <input {...p} name="email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />}
            </Field>
            <Field label="סיסמה" hint={isLogin ? undefined : "לפחות 8 תווים."} error={passwordError}>
              {(p) => <input {...p} name="password" type="password" dir="ltr" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />}
            </Field>
            {isLogin && (
              <p className="text-start">
                <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline">
                  שכחת סיסמה?
                </Link>
              </p>
            )}
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button type="submit" className="w-full" loading={pending}>
              {pending ? (isLogin ? "מתחברים..." : "יוצרים את החשבון...") : isLogin ? "התחברות" : "יצירת חשבון"}
            </Button>
          </form>
        </ValidationContext.Provider>
        <p className="text-center text-gray-700">
          {isLogin ? "אין לכם חשבון? " : "כבר יש לכם חשבון? "}
          <Link href={isLogin ? "/signup" : "/login"} className="inline-flex min-h-11 items-center font-semibold text-indigo-800 underline">
            {isLogin ? "הרשמה" : "התחברות"}
          </Link>
        </p>
      </div>
    </main>
  );
}
