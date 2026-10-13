import type { Metadata } from "next";
import Link from "next/link";
import { getTrafficTotals } from "@/server/traffic";
import { getTopSitesOverview } from "@/server/admin";
import { StatCard } from "@/components/admin/StatCard";

export const metadata: Metadata = { title: "תנועה - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTrafficPage() {
  const [totals, topSites] = await Promise.all([getTrafficTotals(), getTopSitesOverview(50)]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">תנועה</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="היום" value={totals.today} />
        <StatCard label="7 ימים אחרונים" value={totals.last7Days} />
        <StatCard label="30 ימים אחרונים" value={totals.last30Days} />
        <StatCard label="סך הכל" value={totals.allTime} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">עסק</th>
              <th className="px-4 py-3 text-start font-semibold">בעלים</th>
              <th className="px-4 py-3 text-start font-semibold">תוכנית</th>
              <th className="px-4 py-3 text-start font-semibold">כניסות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {topSites.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/sites/${s.id}`} className="font-semibold text-ink-700 underline">{s.businessName}</Link>
                  <p className="text-ink-500" dir="ltr">{s.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-700" dir="ltr">{s.ownerEmail}</td>
                <td className="px-4 py-3">{s.plan}</td>
                <td className="px-4 py-3 font-bold">{s.visits}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topSites.length === 0 && <p className="p-6 text-center text-ink-500">אין עדיין נתוני תנועה.</p>}
      </div>
    </div>
  );
}
