import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listTicketsForUser } from "@/server/support";
import { SUPPORT_CATEGORY_LABELS, SUPPORT_TICKET_STATUS_LABELS, type SupportCategory, type SupportTicketStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "תמיכה" };
export const dynamic = "force-dynamic";

// cx() itself lives in a "use client" module, so a Server Component (this page) cannot import and call it directly - this tiny local copy is the same one-liner.
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const dateFormatter = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

const statusClass: Record<SupportTicketStatus, string> = {
  OPEN: "border-indigo-300 bg-indigo-50 text-indigo-900",
  IN_PROGRESS: "border-amber-300 bg-amber-50 text-amber-900",
  CLOSED: "border-gray-300 bg-gray-100 text-gray-700",
};

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await listTicketsForUser(user.id);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline">← האתרים שלי</Link>
          <h1 className="text-2xl font-extrabold">תמיכה</h1>
        </div>
        <Link href="/support/new" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 text-base font-semibold text-white transition hover:bg-indigo-700">
          + פנייה חדשה
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-xl font-bold">עדיין אין לכם פניות</p>
          <p className="mt-1 text-gray-700">יש שאלה, תקלה או הצעה? אפשר לפתוח פנייה חדשה בכל רגע.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/support/${t.id}`}
              className={cx(
                "flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition hover:bg-gray-50",
                t.unread ? "border-indigo-300 bg-indigo-50/60" : "border-gray-200 bg-white",
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {t.unread && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">תשובה חדשה</span>}
                  <span className={cx("truncate", t.unread ? "font-bold text-gray-950" : "font-semibold text-gray-900")}>{t.subject}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{SUPPORT_CATEGORY_LABELS[t.category as SupportCategory] ?? t.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass[t.status as SupportTicketStatus])}>
                  {SUPPORT_TICKET_STATUS_LABELS[t.status as SupportTicketStatus] ?? t.status}
                </span>
                <span className="text-xs text-gray-500">{dateFormatter.format(t.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
