"use client";

import { useState, useTransition } from "react";
import { submitContactFormAction } from "@/server/actions/contact";
import { emailProblem, phoneProblem } from "@/lib/field-format";
import type { TemplateTheme } from "./types";

const inputCls =
  "w-full rounded-xl border border-t-line bg-t-surface px-4 py-3 text-t-fg outline-none transition placeholder:text-t-muted focus:border-t-accent";

/** Public "צור קשר" form: name, phone, email, message. Submits to a server action that resolves the recipient itself - this component never knows the owner's email. */
export function ContactForm({ slug, t }: { slug: string; t: TemplateTheme }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState({ phone: false, email: false });
  const phoneErr = checked.phone ? phoneProblem(phone) : undefined;
  const emailErr = checked.email ? emailProblem(email) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecked({ phone: true, email: true });
    if (!phone.trim() && !email.trim()) {
      setStatus("error");
      setError("נא למלא טלפון או אימייל.");
      return;
    }
    if (phoneProblem(phone) || emailProblem(email)) {
      setStatus("error");
      setError("יש פרט שצריך לתקן. הוא מסומן למעלה.");
      return;
    }
    setStatus("idle");
    setError("");
    startTransition(async () => {
      try {
        const res = await submitContactFormAction({ slug, name, phone, email, message });
        if (res.ok) {
          setStatus("success");
          setName("");
          setPhone("");
          setEmail("");
          setMessage("");
          setChecked({ phone: false, email: false });
        } else {
          setStatus("error");
          setError(res.error ?? "לא הצלחנו לשלוח את ההודעה. נסו שוב.");
        }
      } catch {
        setStatus("error");
        setError("לא הצלחנו לשלוח את ההודעה. נסו שוב.");
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className={`max-w-xl space-y-4 ${t.narrow} ${t.card}`}>
      <div>
        <label htmlFor="cf-name" className="mb-1.5 block text-sm font-semibold">שם מלא</label>
        <input id="cf-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-phone" className="mb-1.5 block text-sm font-semibold">טלפון</label>
          <input id="cf-phone" type="tel" inputMode="tel" dir="ltr" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setChecked((c) => ({ ...c, phone: true }))} aria-invalid={phoneErr ? true : undefined} aria-describedby={phoneErr ? "cf-phone-err" : undefined} placeholder="050-1234567" maxLength={30} className={inputCls} />
          <FieldError id="cf-phone-err" text={phoneErr} />
        </div>
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-sm font-semibold">אימייל</label>
          <input id="cf-email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setChecked((c) => ({ ...c, email: true }))} aria-invalid={emailErr ? true : undefined} aria-describedby={emailErr ? "cf-email-err" : undefined} placeholder="name@gmail.com" maxLength={120} className={inputCls} />
          <FieldError id="cf-email-err" text={emailErr} />
        </div>
      </div>
      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-sm font-semibold">איך אפשר לעזור?</label>
        <textarea id="cf-message" required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} className={inputCls} />
      </div>
      <button type="submit" disabled={pending} className={`${t.btn} ${t.btnPrimary} w-full disabled:opacity-60 sm:w-auto`}>
        {pending ? "שולח..." : "שליחה"}
      </button>
      <div aria-live="polite">
        {status === "success" && <p className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white">ההודעה נשלחה בהצלחה</p>}
        {status === "error" && <p role="alert" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white">{error}</p>}
      </div>
    </form>
  );
}

/** Shown under a field once the visitor leaves it or presses send - readable on every template's colors. */
function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return <p id={id} className="mt-1.5 inline-block rounded-lg bg-red-600 px-2.5 py-1 text-sm font-medium text-white">{text}</p>;
}
