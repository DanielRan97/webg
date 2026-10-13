"use client";

import { useState, useTransition } from "react";
import { resendVerificationAction } from "@/server/actions/email-verification";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { Button, Notice } from "./ui/ui";

/** Shown on the dashboard until the owner confirms their email. Publishing a site is blocked until then. */
export function VerificationBanner() {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function resend() {
    setNotice(null);
    start(async () => {
      const res = await resendVerificationAction();
      setNotice(res.ok ? { kind: "success", text: "שלחנו קישור אימות חדש. בדקו את תיבת הדואר (וגם את תיקיית הספאם)." } : { kind: "error", text: res.error ?? "לא הצלחנו לשלוח. נסו שוב." });
    });
  }

  return (
    <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
      <p className="font-bold">עדיין לא אימתתם את כתובת האימייל</p>
      <p className="text-sm">אפשר להמשיך לערוך את האתר, אבל צריך לאמת את האימייל לפני שאפשר לפרסם אותו.</p>
      {notice ? (
        <Notice kind={notice.kind}>{notice.text}</Notice>
      ) : (
        <Button type="button" variant="secondary" className="min-h-10 px-4 text-sm" loading={pending} onClick={resend}>
          {pending ? "שולחים..." : "שליחת קישור אימות מחדש"}
        </Button>
      )}
      <p className="text-sm">
        עדיין לא הגיע? כתבו לנו:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" className="font-semibold underline">{SUPPORT_EMAIL}</a>
      </p>
    </div>
  );
}
