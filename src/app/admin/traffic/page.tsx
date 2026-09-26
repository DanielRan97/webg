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
      <h1 className="text-2xl font-extrabold">תנועה</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="היום" value={totals.today} />
        <StatCard label="7 ימים אחרונים" value={totals.last7Days} />
        <StatCard label="30 ימים אחרונים" value={totals.last30Days} />
        <StatCard label="סך הכל" value={totals.allTime} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-300 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-gray-300 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">עסק</th>
              <th className="px-4 py-3 text-start font-semibold">בעלים</th>
              <th className="px-4 py-3 text-start font-semibold">תוכנית</th>
              <th className="px-4 py-3 text-start font-semibold">כניסות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {topSites.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/sites/${s.id}`} className="font-semibold text-indigo-700 underline">{s.businessName}</Link>
                  <p className="text-gray-500" dir="ltr">{s.slug}</p>
                </td>
                <td className="px-4 py-3 text-gray-700" dir="ltr">{s.ownerEmail}</td>
                <td className="px-4 py-3">{s.plan}</td>
                <td className="px-4 py-3 font-bold">{s.visits}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topSites.length === 0 && <p className="p-6 text-center text-gray-600">אין עדיין נתוני תנועה.</p>}
      </div>
    </div>
  );
}
