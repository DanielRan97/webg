"use client";

import { createContext, useContext, useId, useState, useTransition } from "react";
import { emailProblem, normalizeContact, phoneProblem } from "@/lib/field-format";
import { confirmContactCodeAction, sendContactCodeAction } from "@/server/actions/contact-verify";
import { cx, inputClass } from "../ui/ui";

type Kind = "EMAIL" | "PHONE";

interface ContactVerifyState {
  siteId: string;
  /** Verified values as "EMAIL:x" / "PHONE:05..." (see server/contact-verification.ts). */
  verified: Set<string>;
  /** Phone codes need an SMS service; without one, phones aren't verified (or required). */
  phoneOn: boolean;
  markVerified: (key: string) => void;
}

export const ContactVerifyContext = createContext<ContactVerifyState | null>(null);

/** SiteForm's provider: the verified list from the server, plus what gets verified during this visit. */
export function useContactVerifyState(siteId: string, initial: string[], phoneOn: boolean): ContactVerifyState {
  const [verified, setVerified] = useState(() => new Set(initial));
  return { siteId, verified, phoneOn, markVerified: (key) => setVerified((s) => new Set(s).add(key)) };
}

/**
 * Under a contact field (email, phone or WhatsApp): its verification state, and the code flow -
 * "שליחת קוד אימות", type the 6 digits, "אימות". `sameAs` marks a WhatsApp number equal to the phone,
 * which is verified together with it.
 */
export function ContactVerify({ kind, value, label, sameAs }: { kind: Kind; value: string; label: string; sameAs?: string }) {
  const ctx = useContext(ContactVerifyContext);
  const codeId = useId();
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (!ctx || (kind === "PHONE" && !ctx.phoneOn)) return null;

  const normalized = normalizeContact(kind, value);
  const invalid = !normalized || (kind === "EMAIL" ? emailProblem(value) : phoneProblem(value));
  if (invalid) return null;
  if (sameAs && normalizeContact("PHONE", sameAs) === normalized) {
    return <p className="text-xs text-ink-500">אותו מספר כמו הטלפון, ולכן מאומת יחד איתו.</p>;
  }
  const key = `${kind}:${normalized}`;
  if (ctx.verified.has(key)) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
        {label} מאומת
      </p>
    );
  }
  const codeSent = sentTo === normalized;

  function send() {
    setMessage(null);
    start(async () => {
      const res = await sendContactCodeAction(ctx!.siteId, kind, value);
      if (res.verified) {
        ctx!.markVerified(key);
        return;
      }
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error ?? "לא הצלחנו לשלוח קוד. נסו שוב." });
        return;
      }
      setSentTo(normalized);
      setCode("");
      setMessage({ kind: "info", text: kind === "EMAIL" ? `שלחנו קוד בן 6 ספרות אל ${value.trim()}. הוא בתוקף ל-10 דקות.` : `שלחנו קוד בן 6 ספרות ב-SMS אל ${value.trim()}. הוא בתוקף ל-10 דקות.` });
    });
  }

  function confirm() {
    setMessage(null);
    start(async () => {
      const res = await confirmContactCodeAction(ctx!.siteId, kind, value, code);
      if (res.verified) ctx!.markVerified(key);
      else setMessage({ kind: "error", text: res.error ?? "הקוד לא נכון. נסו שוב." });
    });
  }

  return (
    <div className="space-y-2 rounded-lg bg-amber-50 p-3">
      <p className="text-sm text-amber-900">
        {label} עדיין לא מאומת. {kind === "EMAIL" ? "נשלח אליו קוד" : "נשלח אליו קוד ב-SMS"} כדי לוודא שהוא שלכם. בלי אימות אי אפשר לפרסם את האתר.
      </p>
      {codeSent && (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={codeId} className="mb-1 block text-xs font-semibold text-ink-800">הקוד שקיבלתם</label>
            <input
              id={codeId}
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) {
                  e.preventDefault();
                  confirm();
                }
              }}
              placeholder="123456"
              className={cx(inputClass, "w-36 text-center tracking-[0.3em]")}
            />
          </div>
          <button
            type="button"
            disabled={pending || code.length !== 6}
            onClick={confirm}
            className="min-h-11 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            אימות
          </button>
        </div>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={send}
        className="min-h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
      >
        {pending ? "רגע..." : codeSent ? "שליחת קוד חדש" : "שליחת קוד אימות"}
      </button>
      <div aria-live="polite">
        {message && <p className={cx("text-sm", message.kind === "error" ? "font-medium text-red-700" : "text-ink-700")}>{message.text}</p>}
      </div>
    </div>
  );
}
