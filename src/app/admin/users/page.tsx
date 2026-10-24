import type { Metadata } from "next";
import { getUsersOverview } from "@/server/admin";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "משתמשים - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getUsersOverview();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">משתמשים ({users.length})</h1>
      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-start">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">אימייל</th>
              <th className="px-4 py-3 text-start font-semibold">נרשם ב-</th>
              <th className="px-4 py-3 text-start font-semibold">אימות אימייל</th>
              <th className="px-4 py-3 text-start font-semibold">אתרים</th>
              <th className="px-4 py-3 text-start font-semibold">Basic</th>
              <th className="px-4 py-3 text-start font-semibold">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium" dir="ltr">{u.email}</td>
                <td className="px-4 py-3 text-ink-700">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {u.emailVerifiedAt ? (
                    <span className="text-green-800">מאומת ✓</span>
                  ) : (
                    <span className="text-ink-500">לא מאומת</span>
                  )}
                </td>
                <td className="px-4 py-3">{u.siteCount}</td>
                <td className="px-4 py-3">{u.basicCount}</td>
                <td className="px-4 py-3">{u.proCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
