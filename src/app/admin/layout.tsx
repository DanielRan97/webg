import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/server/actions/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex min-h-11 items-center text-xl font-extrabold tracking-tight text-indigo-700">
              WEBG Admin
            </Link>
            <AdminNav />
          </div>
          <AccountMenu email={admin.email} logoutAction={logoutAction} />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
