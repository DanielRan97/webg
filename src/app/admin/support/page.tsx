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
      <h1 className="text-2xl font-extrabold">תמיכה ({tickets.length})</h1>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={withParams({ status: f.value })}
            className={`flex min-h-10 items-center rounded-xl border px-3 text-sm font-semibold transition ${status === f.value ? "border-indigo-700 bg-indigo-50 text-indigo-900" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {f.label}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px bg-gray-300" aria-hidden />
        <Link
          href={withParams({ category: "" })}
          className={`flex min-h-10 items-center rounded-xl border px-3 text-sm font-semibold transition ${!category ? "border-indigo-700 bg-indigo-50 text-indigo-900" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
        >
          כל הקטגוריות
        </Link>
        {(Object.keys(SUPPORT_CATEGORY_LABELS) as SupportCategory[]).map((c) => (
          <Link
            key={c}
            href={withParams({ category: c })}
            className={`flex min-h-10 items-center rounded-xl border px-3 text-sm font-semibold transition ${category === c ? "border-indigo-700 bg-indigo-50 text-indigo-900" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
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
            className="min-h-10 w-full max-w-xs rounded-xl border border-gray-400 px-3 text-sm outline-none focus:border-indigo-600"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-300 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-gray-300 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">נושא</th>
              <th className="px-4 py-3 text-start font-semibold">משתמש</th>
              <th className="px-4 py-3 text-start font-semibold">קטגוריה</th>
              <th className="px-4 py-3 text-start font-semibold">סטטוס</th>
              <th className="px-4 py-3 text-start font-semibold">עודכן</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((t) => (
              <tr key={t.id} className={t.unread ? "bg-indigo-50/60" : undefined}>
                <td className="px-4 py-3">
                  <Link href={`/admin/support/${t.id}`} className="font-semibold text-indigo-700 underline">
                    {t.unread && <span className="me-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">חדש</span>}
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700" dir="ltr">{t.userEmail}</td>
                <td className="px-4 py-3">{SUPPORT_CATEGORY_LABELS[t.category as SupportCategory] ?? t.category}</td>
                <td className="px-4 py-3">{SUPPORT_TICKET_STATUS_LABELS[t.status as SupportTicketStatus] ?? t.status}</td>
                <td className="px-4 py-3 text-gray-700">{dateFormatter.format(t.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && <p className="p-6 text-center text-gray-600">לא נמצאו פניות.</p>}
      </div>
    </div>
  );
}
