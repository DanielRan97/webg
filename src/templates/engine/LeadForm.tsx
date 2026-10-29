"use client";

import { useState, useTransition } from "react";
import { submitLeadFormAction } from "@/server/actions/lead";
import { emailProblem, phoneProblem } from "@/lib/field-format";
import { FormTrustNote, TrapField, useFormGuard } from "./form-guard";
import { useTurnstile } from "./Turnstile";
import type { TemplateTheme } from "./types";

const inputCls =
  "w-full rounded-xl border border-t-line bg-t-surface px-4 py-3 text-t-fg outline-none transition placeholder:text-t-muted focus:border-t-accent";

/** Public "השאירו פרטים" callback form: name + phone (required) and email (optional). Deliberately short - no message field, unlike the fuller "שליחת הודעה" inquiry form. Submits to a server action that resolves the recipient itself - this component never knows the owner's email. */
export function LeadForm({ slug, businessName, t }: { slug: string; businessName: string; t: TemplateTheme }) {
  const { trap, setTrap, guard } = useFormGuard();
  const turnstile = useTurnstile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState({ phone: false, email: false });
  const phoneErr = checked.phone ? (phone.trim() ? phoneProblem(phone) : "נא למלא מספר טלפון.") : undefined;
  const emailErr = checked.email ? emailProblem(email) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecked({ phone: true, email: true });
    if (!phone.trim() || phoneProblem(phone) || emailProblem(email)) {
      setStatus("error");
      setError("יש פרט שצריך לתקן. הוא מסומן למעלה.");
      return;
    }
    if (turnstile.failed) {
      setStatus("error");
      setError("לא הצלחנו לוודא שהשליחה אמיתית. רעננו את הדף ונסו שוב.");
      return;
    }
    if (!turnstile.ready) {
      setStatus("error");
      setError("רגע, מוודאים שהשליחה אמיתית. נסו שוב בעוד שנייה.");
      return;
    }
    setStatus("idle");
    setError("");
    startTransition(async () => {
      try {
        const res = await submitLeadFormAction({ slug, name, phone, email, guard: guard(), turnstile: turnstile.token });
        turnstile.reset();
        if (res.ok) {
          setStatus("success");
          setName("");
          setPhone("");
          setEmail("");
          setChecked({ phone: false, email: false });
        } else {
          setStatus("error");
          setError(res.error ?? "לא הצלחנו לשלוח את הפרטים. נסו שוב.");
        }
      } catch {
        turnstile.reset();
        setStatus("error");
        setError("לא הצלחנו לשלוח את הפרטים. נסו שוב.");
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className={`relative max-w-xl space-y-4 ${t.narrow} ${t.card}`}>
      <TrapField value={trap} onChange={setTrap} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="lf-name" className="mb-1.5 block text-sm font-semibold">שם מלא</label>
          <input id="lf-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputCls} />
        </div>
        <div>
          <label htmlFor="lf-phone" className="mb-1.5 block text-sm font-semibold">מספר טלפון</label>
          <input id="lf-phone" required type="tel" inputMode="tel" dir="ltr" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setChecked((c) => ({ ...c, phone: true }))} aria-invalid={phoneErr ? true : undefined} aria-describedby={phoneErr ? "lf-phone-err" : undefined} placeholder="050-1234567" maxLength={30} className={inputCls} />
          <FieldError id="lf-phone-err" text={phoneErr} />
        </div>
        <div>
          <label htmlFor="lf-email" className="mb-1.5 block text-sm font-semibold">אימייל (לא חובה)</label>
          <input id="lf-email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setChecked((c) => ({ ...c, email: true }))} aria-invalid={emailErr ? true : undefined} aria-describedby={emailErr ? "lf-email-err" : undefined} placeholder="name@gmail.com" maxLength={120} className={inputCls} />
          <FieldError id="lf-email-err" text={emailErr} />
        </div>
      </div>
      {turnstile.widget}
      <button type="submit" disabled={pending} className={`${t.btn} ${t.btnPrimary} w-full disabled:opacity-60 sm:w-auto`}>
        {pending ? "שולח..." : "חזרו אליי"}
      </button>
      <FormTrustNote businessName={businessName} />
      <div aria-live="polite">
        {status === "success" && (
          <p className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white">
            הפרטים נשלחו בהצלחה
            <span className="block font-normal opacity-90">{businessName || "בית העסק"} קיבלו את הפרטים שלכם ויחזרו אליכם.</span>
          </p>
        )}
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
