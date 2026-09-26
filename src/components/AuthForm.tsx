"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { AuthState } from "@/server/actions/auth";
import { AuthCard } from "./AuthCard";
import { Button, Field, Notice, PasswordField, ValidationContext, inputClass } from "./ui/ui";

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
    <AuthCard
      heading={isLogin ? "ברוכים השבים" : "יוצרים חשבון"}
      subtitle={isLogin ? "התחברו כדי לנהל, לערוך ולפרסם את האתרים שלכם." : "כמה שניות ואפשר להתחיל. בלי כרטיס אשראי."}
      footer={
        <p className="text-center text-gray-700">
          {isLogin ? "אין לכם חשבון? " : "כבר יש לכם חשבון? "}
          <Link href={isLogin ? "/signup" : "/login"} className="inline-flex min-h-11 items-center font-semibold text-indigo-800 underline">
            {isLogin ? "הרשמה" : "התחברות"}
          </Link>
        </p>
      }
    >
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
          <PasswordField
            label="סיסמה"
            hint={isLogin ? undefined : "לפחות 8 תווים."}
            error={passwordError}
            name="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={setPassword}
          />
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
          {!isLogin && (
            <p className="text-center text-xs text-gray-500">
              בהרשמה אתם מאשרים את{" "}
              <Link href="/terms" className="underline hover:text-gray-700">תנאי השימוש</Link>
              {" "}ואת{" "}
              <Link href="/privacy" className="underline hover:text-gray-700">מדיניות הפרטיות</Link>
              {" "}שלנו.
            </p>
          )}
        </form>
      </ValidationContext.Provider>
    </AuthCard>
  );
}
