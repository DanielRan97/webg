"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, type ForgotPasswordState } from "@/server/actions/password-reset";
import { AuthCard } from "./AuthCard";
import { Button, Field, Notice, inputClass } from "./ui/ui";

const initial: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initial);

  return (
    <AuthCard
      heading="שכחתם סיסמה?"
      subtitle="כתבו את כתובת האימייל שלכם, ונשלח לכם קישור לבחירת סיסמה חדשה."
      footer={
        <p className="text-center text-gray-700">
          <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-indigo-800 underline">
            חזרה להתחברות
          </Link>
        </p>
      }
    >
      {state.message ? (
        <Notice kind="success">{state.message}</Notice>
      ) : (
        <form action={formAction} className="space-y-4">
          <Field label="אימייל">
            {(p) => <input {...p} name="email" type="email" dir="ltr" autoComplete="email" required className={inputClass} />}
          </Field>
          {state.error && <Notice kind="error">{state.error}</Notice>}
          <Button type="submit" className="w-full" loading={pending}>
            {pending ? "שולחים..." : "שלחו לי קישור"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
