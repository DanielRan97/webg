import type { Metadata } from "next";
import Link from "next/link";
import { getSitesOverview, type SiteFilter } from "@/server/admin";

export const metadata: Metadata = { title: "אתרים - WEBG Admin" };
export const dynamic = "force-dynamic";

const FILTERS: { value: SiteFilter; label: string }[] = [
  { value: "ALL", label: "הכל" },
  { value: "BASIC", label: "Basic" },
  { value: "PRO", label: "Pro" },
  { value: "PUBLISHED", label: "פורסמו" },
  { value: "DRAFT", label: "טיוטות" },
];

function isFilter(v: string | undefined): v is SiteFilter {
  return FILTERS.some((f) => f.value === v);
}

export default async function AdminSitesPage({ searchParams }: PageProps<"/admin/sites">) {
  const sp = await searchParams;
  const filterParam = typeof sp.filter === "string" ? sp.filter : "ALL";
  const filter: SiteFilter = isFilter(filterParam) ? filterParam : "ALL";
  const q = typeof sp.q === "string" ? sp.q : "";

  const sites = await getSitesOverview(filter, q);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">אתרים ({sites.length})</h1>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const qs = new URLSearchParams();
          if (f.value !== "ALL") qs.set("filter", f.value);
          if (q) qs.set("q", q);
          const href = qs.size > 0 ? `/admin/sites?${qs.toString()}` : "/admin/sites";
          const active = filter === f.value;
          return (
            <Link
              key={f.value}
              href={href}
              className={`flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition ${active ? "border-brand-600 bg-brand-50 text-ink-900 ring-1 ring-brand-600" : "border-ink-200 bg-white text-ink-700 hover:border-ink-500"}`}
            >
              {f.label}
            </Link>
          );
        })}
        <form className="flex min-h-10 flex-1 items-center gap-2" action="/admin/sites">
          {filter !== "ALL" && <input type="hidden" name="filter" value={filter} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="חיפוש לפי שם עסק, כתובת או אימייל"
            className="min-h-10 w-full max-w-xs rounded-lg border border-ink-300 bg-white px-3 text-sm text-ink-900 outline-none hover:border-ink-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15 focus-visible:outline-none"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">עסק</th>
              <th className="px-4 py-3 text-start font-semibold">בעלים</th>
              <th className="px-4 py-3 text-start font-semibold">תוכנית</th>
              <th className="px-4 py-3 text-start font-semibold">סטטוס</th>
              <th className="px-4 py-3 text-start font-semibold">נוצר</th>
              <th className="px-4 py-3 text-start font-semibold">עודכן</th>
              <th className="px-4 py-3 text-start font-semibold">כניסות</th>
              <th className="px-4 py-3 text-start font-semibold">פניות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {sites.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/sites/${s.id}`} className="font-semibold text-ink-700 underline">{s.businessName}</Link>
                  <p className="text-ink-500" dir="ltr">{s.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-700" dir="ltr">{s.ownerEmail}</td>
                <td className="px-4 py-3">{s.plan}</td>
                <td className="px-4 py-3">{s.status === "PUBLISHED" ? "מפורסם" : "טיוטה"}</td>
                <td className="px-4 py-3 text-ink-700">{s.createdAt.toLocaleDateString("he-IL")}</td>
                <td className="px-4 py-3 text-ink-700">{s.updatedAt.toLocaleDateString("he-IL")}</td>
                <td className="px-4 py-3">{s.visits}</td>
                <td className="px-4 py-3">{s.interactionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sites.length === 0 && <p className="p-6 text-center text-ink-500">לא נמצאו אתרים.</p>}
      </div>
    </div>
  );
}
