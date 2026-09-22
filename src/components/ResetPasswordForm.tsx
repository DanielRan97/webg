"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "@/server/actions/password-reset";
import { Button, Field, Notice, ValidationContext, inputClass } from "./ui/ui";

const initial: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const passwordError = password.length > 0 && password.length < 8 ? "הסיסמה צריכה להכיל לפחות 8 תווים." : undefined;
  const confirmError = confirm.length > 0 && confirm !== password ? "הסיסמאות לא זהות." : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-gray-300 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex min-h-11 items-center text-3xl font-extrabold text-indigo-700">WEBG</Link>
          <h1 className="mt-2 text-2xl font-bold">בחירת סיסמה חדשה</h1>
        </div>

        {state.ok ? (
          <div className="space-y-4">
            <Notice kind="success">הסיסמה עודכנה בהצלחה. אפשר להתחבר עם הסיסמה החדשה.</Notice>
            <Link href="/login" className="flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700">
              מעבר להתחברות
            </Link>
          </div>
        ) : !token ? (
          <Notice kind="error">הקישור לא תקין. אפשר לבקש קישור חדש בדף &quot;שכחת סיסמה&quot;.</Notice>
        ) : (
          <ValidationContext.Provider value={{ submitted }}>
            <form action={formAction} onSubmit={() => setSubmitted(true)} className="space-y-4">
              <input type="hidden" name="token" value={token} />
              <Field label="סיסמה חדשה" hint="לפחות 8 תווים." error={passwordError}>
                {(p) => <input {...p} name="password" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />}
              </Field>
              <Field label="אימות סיסמה" error={confirmError}>
                {(p) => <input {...p} name="confirmPassword" type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />}
              </Field>
              {state.error && <Notice kind="error">{state.error}</Notice>}
              <Button type="submit" className="w-full" loading={pending}>
                {pending ? "מעדכנים..." : "עדכון הסיסמה"}
              </Button>
            </form>
          </ValidationContext.Provider>
        )}

        <p className="text-center text-gray-700">
          <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-indigo-800 underline">
            חזרה להתחברות
          </Link>
        </p>
      </div>
    </main>
  );
}
