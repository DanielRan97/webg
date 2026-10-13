import Link from "next/link";
import type { ReactNode } from "react";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { WebgMark } from "./WebgMark";

/**
 * Shared shell for every auth screen (login, signup, forgot/reset password,
 * verify email) so card width, radius, border, padding and the
 * wordmark/heading hierarchy never drift between them.
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
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-6 sm:py-8">
      <div className="w-full max-w-md space-y-5 rounded-xl border border-ink-200 bg-white p-6 sm:p-8">
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
    </main>
  );
}
