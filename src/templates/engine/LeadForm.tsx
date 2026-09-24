"use client";

import { useState, useTransition } from "react";
import { submitLeadFormAction } from "@/server/actions/lead";
import type { TemplateTheme } from "./types";

const inputCls =
  "w-full rounded-xl border border-t-line bg-t-surface px-4 py-3 text-t-fg outline-none transition placeholder:text-t-muted focus:border-t-accent";

/** Public "השאירו פרטים" callback form: name + phone (required) and email (optional). Deliberately short - no message field, unlike the fuller "שליחת הודעה" inquiry form. Submits to a server action that resolves the recipient itself - this component never knows the owner's email. */
export function LeadForm({ slug, t }: { slug: string; t: TemplateTheme }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setError("");
    startTransition(async () => {
      try {
        const res = await submitLeadFormAction({ slug, name, phone, email });
        if (res.ok) {
          setStatus("success");
          setName("");
          setPhone("");
          setEmail("");
        } else {
          setStatus("error");
          setError(res.error ?? "לא הצלחנו לשלוח את הפרטים. נסו שוב.");
        }
      } catch {
        setStatus("error");
        setError("לא הצלחנו לשלוח את הפרטים. נסו שוב.");
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className={`max-w-xl space-y-4 ${t.narrow} ${t.card}`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="lf-name" className="mb-1.5 block text-sm font-semibold">שם מלא</label>
          <input id="lf-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lf-phone" className="mb-1.5 block text-sm font-semibold">מספר טלפון</label>
          <input id="lf-phone" required type="tel" inputMode="tel" dir="ltr" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lf-email" className="mb-1.5 block text-sm font-semibold">אימייל (לא חובה)</label>
          <input id="lf-email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} className={inputCls} />
        </div>
      </div>
      <button type="submit" disabled={pending} className={`${t.btn} ${t.btnPrimary} w-full disabled:opacity-60 sm:w-auto`}>
        {pending ? "שולח..." : "חזרו אליי"}
      </button>
      <div aria-live="polite">
        {status === "success" && (
          <p className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white">
            הפרטים נשלחו בהצלחה
            <span className="block font-normal opacity-90">בית העסק קיבל את הפרטים שלכם ויוכל לחזור אליכם.</span>
          </p>
        )}
        {status === "error" && <p role="alert" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white">{error}</p>}
      </div>
    </form>
  );
}
