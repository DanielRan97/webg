import Link from "next/link";
import { requireUser } from "@/lib/session";
import { logoutAction } from "@/server/actions/auth";
import { AccountMenu } from "@/components/AccountMenu";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="sr-only rounded-xl bg-white px-4 py-3 font-semibold focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50">
        דלגו לתוכן הראשי
      </a>
      <header className="sticky top-0 z-40 border-b border-gray-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex min-h-11 items-center text-2xl font-extrabold tracking-tight text-indigo-700">WEBG</Link>
          <AccountMenu email={user.email} logoutAction={logoutAction} />
        </div>
      </header>
      <div id="main-content" tabIndex={-1} className="outline-none">{children}</div>
    </div>
  );
}
