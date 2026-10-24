import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/server/actions/auth";
import { getAdminUnreadCount } from "@/server/support";
import { AccountMenu } from "@/components/AccountMenu";
import { AdminNav } from "@/components/admin/AdminNav";
import { WebgMark } from "@/components/WebgMark";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const supportUnreadCount = await getAdminUnreadCount();
  return (
    <div dir="rtl" className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" aria-label="WEBG Admin" className="flex min-h-11 items-center">
              <WebgMark suffix="Admin" />
            </Link>
            <AdminNav supportUnreadCount={supportUnreadCount} />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex min-h-11 items-center rounded-lg border border-ink-200 shadow-sm px-3 text-sm font-semibold text-ink-800 transition hover:bg-ink-50"
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
