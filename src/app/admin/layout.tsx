import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/server/actions/auth";
import { getAdminUnreadCount } from "@/server/support";
import { AccountMenu } from "@/components/AccountMenu";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const supportUnreadCount = await getAdminUnreadCount();
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="flex min-h-11 items-center text-xl font-extrabold tracking-tight text-indigo-700">
              WEBG Admin
            </Link>
            <AdminNav supportUnreadCount={supportUnreadCount} />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex min-h-11 items-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              ← חזרה ל-WEBG
            </Link>
            <AccountMenu email={admin.email} logoutAction={logoutAction} />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
