import Link from "next/link";
import { requireUser } from "@/lib/session";
import { logoutAction } from "@/server/actions/auth";

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
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-gray-700 sm:inline" dir="ltr">{user.email}</span>
            <form action={logoutAction}>
              <button className="min-h-11 px-2 font-semibold text-gray-900 hover:underline">התנתקות</button>
            </form>
          </div>
        </div>
      </header>
      <div id="main-content" tabIndex={-1} className="outline-none">{children}</div>
    </div>
  );
}
