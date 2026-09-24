"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "@/server/actions/password-reset";
import { AuthCard } from "./AuthCard";
import { Button, Notice, PasswordField, ValidationContext } from "./ui/ui";

const initial: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const passwordError = password.length > 0 && password.length < 8 ? "הסיסמה צריכה להכיל לפחות 8 תווים." : undefined;
  const confirmError = confirm.length > 0 && confirm !== password ? "הסיסמאות לא זהות." : undefined;

  return (
    <AuthCard
      heading="בחירת סיסמה חדשה"
      footer={
        <p className="text-center text-gray-700">
          <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-indigo-800 underline">
            חזרה להתחברות
          </Link>
        </p>
      }
    >
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
            <PasswordField label="סיסמה חדשה" hint="לפחות 8 תווים." error={passwordError} name="password" autoComplete="new-password" value={password} onChange={setPassword} />
            <PasswordField label="אימות סיסמה" error={confirmError} name="confirmPassword" autoComplete="new-password" value={confirm} onChange={setConfirm} />
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button type="submit" className="w-full" loading={pending}>
              {pending ? "מעדכנים..." : "עדכון הסיסמה"}
            </Button>
          </form>
        </ValidationContext.Provider>
      )}
    </AuthCard>
  );
}
