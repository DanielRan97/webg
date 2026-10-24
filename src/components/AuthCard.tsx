import Link from "next/link";
import type { ReactNode } from "react";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { WebgMark } from "./WebgMark";
import { Blueprint } from "./landing/Blueprint";
import { KeyIcon, LockIcon, MailCheckIcon } from "./icons";

/** Only claims the product meets today (see the home page's security section). */
const TRUST = [
  { Icon: LockIcon, text: "כל אתר עולה עם חיבור HTTPS מאובטח" },
  { Icon: KeyIcon, text: "הסיסמה נשמרת מוצפנת, אף אחד לא יכול לקרוא אותה" },
  { Icon: MailCheckIcon, text: "אתר מתפרסם רק אחרי אימות האימייל שלכם" },
];

/**
 * Shared shell for every auth screen (login, signup, forgot/reset password, verify email) so the form
 * card, the wordmark/heading hierarchy and the help line never drift between them. On wide screens the
 * page splits: the form on the start side, and the home page's dark blueprint panel with the security
 * claims on the other - the same first impression the home page makes.
 */
export function AuthCard({
  heading,
  subtitle,
  children,
  footer,
}: {
  heading: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="webg-rise w-full max-w-md space-y-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgb(15_27_48/0.35)] sm:p-8">
          <div>
            <Link href="/" aria-label="WEBG - לדף הבית" className="inline-flex min-h-11 items-center"><WebgMark size="sm" /></Link>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">{heading}</h1>
            {subtitle && <p className="mt-2 text-ink-700">{subtitle}</p>}
          </div>
          {children}
          {footer}
          {/* Everyone on these screens is logged out, so the in-app /support area is out of reach - email is their only way to us. */}
          <p className="border-t border-ink-100 pt-4 text-sm text-ink-700">
            צריכים עזרה או שלא הגיע מייל? כתבו לנו:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">{SUPPORT_EMAIL}</a>
          </p>
        </div>
      </div>

      <aside aria-label="למה WEBG" className="relative hidden overflow-hidden bg-ink-950 lg:flex lg:items-center lg:justify-center">
        <Blueprint />
        <div className="relative max-w-md px-10 text-white">
          <WebgMark tone="dark" />
          <p className="mt-8 text-4xl font-bold leading-tight tracking-tight">
            ממלאים טופס.
            <br />
            <span className="text-ink-300">מקבלים אתר.</span>
          </p>
          <ul className="mt-10 space-y-4">
            {TRUST.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-ink-200">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-200">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
