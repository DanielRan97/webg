import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listTicketsForUser } from "@/server/support";
import { SUPPORT_CATEGORY_LABELS, SUPPORT_EMAIL, SUPPORT_TICKET_STATUS_LABELS, type SupportCategory, type SupportTicketStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "תמיכה" };
export const dynamic = "force-dynamic";

// cx() itself lives in a "use client" module, so a Server Component (this page) cannot import and call it directly - this tiny local copy is the same one-liner.
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");


const statusClass: Record<SupportTicketStatus, string> = {
  OPEN: "border-ink-300 bg-ink-50 text-ink-900",
  IN_PROGRESS: "border-amber-300 bg-amber-50 text-amber-900",
  CLOSED: "border-ink-200 bg-ink-50 text-ink-700",
};

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await listTicketsForUser(user.id);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">← האתרים שלי</Link>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">תמיכה</h1>
          <p className="mt-1 text-sm text-ink-500">
            אפשר גם לכתוב לנו:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">{SUPPORT_EMAIL}</a>
          </p>
        </div>
        <Link href="/support/new" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-600 px-5 text-base font-semibold text-white transition hover:bg-brand-700 hover:shadow-[0_8px_20px_-8px_rgb(21_70_209/0.55)] active:scale-[0.98]">
          + פנייה חדשה
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center">
          <p className="text-xl font-bold">עדיין אין לכם פניות</p>
          <p className="mt-1 text-ink-700">יש שאלה, תקלה או הצעה? אפשר לפתוח פנייה חדשה בכל רגע.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/support/${t.id}`}
              className={cx(
                "flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_14px_30px_-22px_rgb(21_70_209/0.5)]",
                t.unread ? "border-brand-200 bg-brand-50/60" : "border-ink-200 bg-white",
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {t.unread && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">תשובה חדשה</span>}
                  <span className={cx("truncate", t.unread ? "font-bold text-ink-950" : "font-semibold text-ink-900")}>{t.subject}</span>
                </div>
                <p className="mt-1 text-sm text-ink-500">{SUPPORT_CATEGORY_LABELS[t.category as SupportCategory] ?? t.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass[t.status as SupportTicketStatus])}>
                  {SUPPORT_TICKET_STATUS_LABELS[t.status as SupportTicketStatus] ?? t.status}
                </span>
                <span className="text-xs text-ink-500">{formatDateTime(t.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
