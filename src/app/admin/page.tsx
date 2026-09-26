import type { Metadata } from "next";
import Link from "next/link";
import { getOverviewStats, getTopSitesOverview, getRecentActivity } from "@/server/admin";
import { StatCard } from "@/components/admin/StatCard";

export const metadata: Metadata = { title: "WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, topSites, activity] = await Promise.all([
    getOverviewStats(),
    getTopSitesOverview(10),
    getRecentActivity(8),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">WEBG Admin</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="משתמשים" value={stats.userCount} />
        <StatCard label="אתרים" value={stats.siteCount} />
        <StatCard label="אתרים פעילים" value={stats.publishedCount} />
        <StatCard label="אתרי טיוטה" value={stats.draftCount} />
        <StatCard label="Basic" value={stats.basicCount} />
        <StatCard label="Pro" value={stats.proCount} />
        <StatCard label="כניסות לאתרים" value={stats.totalVisits} />
        <StatCard label="פניות שהתקבלו" value={stats.interactionCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-gray-300 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">אתרים עם הכי הרבה כניסות</h2>
            <Link href="/admin/traffic" className="text-sm font-semibold text-indigo-700 underline">כל התנועה</Link>
          </div>
          {topSites.length === 0 ? (
            <p className="text-sm text-gray-600">אין עדיין נתוני תנועה.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {topSites.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/admin/sites/${s.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{s.businessName}</p>
                    <p className="truncate text-gray-600" dir="ltr">{s.slug} · {s.ownerEmail} · {s.plan}</p>
                  </Link>
                  <span className="shrink-0 font-bold text-gray-900">{s.visits}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-gray-300 bg-white p-4">
          <h2 className="text-lg font-bold">פעילות אחרונה</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-600">אין עדיין פעילות.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {activity.map((a, i) => (
                <li key={i} className="py-2 text-sm">
                  <p className="text-gray-900">{a.label}</p>
                  <p className="text-gray-500">{a.at.toLocaleString("he-IL")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
