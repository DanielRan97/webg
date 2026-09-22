"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmVerifyEmailAction, type SimpleState } from "@/server/actions/email-verification";
import { Button, Notice } from "./ui/ui";

const initial: SimpleState = {};

/**
 * Requires an explicit click rather than acting the moment the page loads -
 * see the comment on confirmVerifyEmailAction for why (automated link
 * scanners in some mail clients "visit" links before a person does).
 */
export function VerifyEmailConfirm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(confirmVerifyEmailAction, initial);

  if (!token) return <Notice kind="error">קישור האימות לא תקין.</Notice>;

  if (state.ok) {
    return <Notice kind="success">האימייל אומת בהצלחה. עכשיו אפשר לפרסם את האתר שלכם.</Notice>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-gray-700">לחצו לאישור שזו כתובת האימייל שלכם.</p>
      {state.error && <Notice kind="error">{state.error}</Notice>}
      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "מאמתים..." : "אימות האימייל"}
      </Button>
    </form>
  );
}

export function VerifyEmailLinks() {
  return (
    <Link href="/dashboard" className="flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700">
      מעבר ללוח הבקרה
    </Link>
  );
}
