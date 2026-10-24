import type { Metadata } from "next";
import Link from "next/link";
import { adminListTickets } from "@/server/support";
import { SUPPORT_CATEGORY_LABELS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_STATUS_LABELS, type SupportCategory, type SupportTicketStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "תמיכה - WEBG Admin" };
export const dynamic = "force-dynamic";

type StatusFilter = "ALL" | SupportTicketStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "הכל" },
  { value: SUPPORT_TICKET_STATUS.OPEN, label: "פתוח" },
  { value: SUPPORT_TICKET_STATUS.IN_PROGRESS, label: "בטיפול" },
  { value: SUPPORT_TICKET_STATUS.CLOSED, label: "סגור" },
];

function isStatusFilter(v: string | undefined): v is StatusFilter {
  return STATUS_FILTERS.some((f) => f.value === v);
}

const dateFormatter = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

export default async function AdminSupportPage({ searchParams }: PageProps<"/admin/support">) {
  const sp = await searchParams;
  const statusParam = typeof sp.status === "string" ? sp.status : "ALL";
  const status: StatusFilter = isStatusFilter(statusParam) ? statusParam : "ALL";
  const categoryParam = typeof sp.category === "string" ? sp.category : "";
  const category = categoryParam in SUPPORT_CATEGORY_LABELS ? (categoryParam as SupportCategory) : undefined;
  const q = typeof sp.q === "string" ? sp.q : "";

  const tickets = await adminListTickets({ status: status === "ALL" ? undefined : status, category, q });

  function withParams(overrides: { status?: StatusFilter; category?: string }) {
    const qs = new URLSearchParams();
    const s = overrides.status ?? status;
    const c = overrides.category ?? categoryParam;
    if (s !== "ALL") qs.set("status", s);
    if (c) qs.set("category", c);
    if (q) qs.set("q", q);
    return qs.size > 0 ? `/admin/support?${qs.toString()}` : "/admin/support";
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">תמיכה ({tickets.length})</h1>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={withParams({ status: f.value })}
            className={`flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition ${status === f.value ? "border-brand-600 bg-brand-50 text-ink-900 ring-1 ring-brand-600" : "border-ink-200 bg-white text-ink-700 hover:border-ink-500"}`}
          >
            {f.label}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px bg-ink-200" aria-hidden />
        <Link
          href={withParams({ category: "" })}
          className={`flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition ${!category ? "border-brand-600 bg-brand-50 text-ink-900 ring-1 ring-brand-600" : "border-ink-200 bg-white text-ink-700 hover:border-ink-500"}`}
        >
          כל הקטגוריות
        </Link>
        {(Object.keys(SUPPORT_CATEGORY_LABELS) as SupportCategory[]).map((c) => (
          <Link
            key={c}
            href={withParams({ category: c })}
            className={`flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition ${category === c ? "border-brand-600 bg-brand-50 text-ink-900 ring-1 ring-brand-600" : "border-ink-200 bg-white text-ink-700 hover:border-ink-500"}`}
          >
            {SUPPORT_CATEGORY_LABELS[c]}
          </Link>
        ))}
        <form className="flex min-h-10 flex-1 items-center gap-2" action="/admin/support">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          {category && <input type="hidden" name="category" value={category} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="חיפוש לפי נושא או אימייל"
            className="min-h-10 w-full max-w-xs rounded-lg border border-ink-300 bg-white px-3 text-sm text-ink-900 outline-none hover:border-ink-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15 focus-visible:outline-none"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">נושא</th>
              <th className="px-4 py-3 text-start font-semibold">משתמש</th>
              <th className="px-4 py-3 text-start font-semibold">קטגוריה</th>
              <th className="px-4 py-3 text-start font-semibold">סטטוס</th>
              <th className="px-4 py-3 text-start font-semibold">עודכן</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {tickets.map((t) => (
              <tr key={t.id} className={t.unread ? "bg-ink-50/60" : undefined}>
                <td className="px-4 py-3">
                  <Link href={`/admin/support/${t.id}`} className="font-semibold text-ink-700 underline">
                    {t.unread && <span className="me-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">חדש</span>}
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-700" dir="ltr">{t.userEmail}</td>
                <td className="px-4 py-3">{SUPPORT_CATEGORY_LABELS[t.category as SupportCategory] ?? t.category}</td>
                <td className="px-4 py-3">{SUPPORT_TICKET_STATUS_LABELS[t.status as SupportTicketStatus] ?? t.status}</td>
                <td className="px-4 py-3 text-ink-700">{dateFormatter.format(t.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && <p className="p-6 text-center text-ink-500">לא נמצאו פניות.</p>}
      </div>
    </div>
  );
}
