"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, type ForgotPasswordState } from "@/server/actions/password-reset";
import { Button, Field, Notice, inputClass } from "./ui/ui";

const initial: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-gray-300 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex min-h-11 items-center text-3xl font-extrabold text-indigo-700">WEBG</Link>
          <h1 className="mt-2 text-2xl font-bold">שכחתם סיסמה?</h1>
          <p className="text-gray-700">כתבו את כתובת האימייל שלכם, ונשלח לכם קישור לבחירת סיסמה חדשה.</p>
        </div>

        {state.message ? (
          <Notice kind="success">{state.message}</Notice>
        ) : (
          <form action={formAction} className="space-y-4">
            <Field label="אימייל">
              {(p) => <input {...p} name="email" type="email" dir="ltr" autoComplete="email" required className={inputClass} />}
            </Field>
            {state.error && <Notice kind="error">{state.error}</Notice>}
            <Button type="submit" className="w-full" loading={pending}>
              {pending ? "שולחים..." : "שליחת קישור לאיפוס"}
            </Button>
          </form>
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
