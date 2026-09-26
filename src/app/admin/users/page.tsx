import type { Metadata } from "next";
import { getUsersOverview } from "@/server/admin";

export const metadata: Metadata = { title: "משתמשים - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getUsersOverview();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">משתמשים ({users.length})</h1>
      <div className="overflow-x-auto rounded-2xl border border-gray-300 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-gray-300 bg-gray-50 text-start">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">אימייל</th>
              <th className="px-4 py-3 text-start font-semibold">נרשם ב-</th>
              <th className="px-4 py-3 text-start font-semibold">אימות אימייל</th>
              <th className="px-4 py-3 text-start font-semibold">אתרים</th>
              <th className="px-4 py-3 text-start font-semibold">Basic</th>
              <th className="px-4 py-3 text-start font-semibold">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium" dir="ltr">{u.email}</td>
                <td className="px-4 py-3 text-gray-700">{u.createdAt.toLocaleDateString("he-IL")}</td>
                <td className="px-4 py-3">
                  {u.emailVerifiedAt ? (
                    <span className="text-green-800">מאומת ✓</span>
                  ) : (
                    <span className="text-gray-500">לא מאומת</span>
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
