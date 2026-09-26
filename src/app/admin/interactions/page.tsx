import type { Metadata } from "next";
import { getInteractionsOverview, getRecentActivity } from "@/server/admin";
import { StatCard } from "@/components/admin/StatCard";

export const metadata: Metadata = { title: "פניות - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminInteractionsPage() {
  const [stats, activity] = await Promise.all([getInteractionsOverview(), getRecentActivity(20)]);
  const recentInteractions = activity.filter((a) => a.kind === "INTERACTION");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">פניות</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="סך הכל" value={stats.total} />
        <StatCard label="היום" value={stats.today} />
        <StatCard label="לידים" value={stats.leads} />
        <StatCard label="הודעות" value={stats.messages} />
      </div>

      <section className="space-y-3 rounded-2xl border border-gray-300 bg-white p-4">
        <h2 className="text-lg font-bold">פעילות אחרונה</h2>
        {recentInteractions.length === 0 ? (
          <p className="text-sm text-gray-600">אין עדיין פניות.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentInteractions.map((a, i) => (
              <li key={i} className="py-2 text-sm">
                <p className="text-gray-900">{a.label}</p>
                <p className="text-gray-500">{a.at.toLocaleString("he-IL")}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500">פרטי הפנייה המלאים (שם, טלפון, הודעה) נשארים במרכז הפניות של כל אתר בנפרד.</p>
      </section>
    </div>
  );
}
