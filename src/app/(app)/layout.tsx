import Link from "next/link";
import { requireUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { logoutAction } from "@/server/actions/auth";
import { getUserUnreadCount } from "@/server/support";
import { AccountMenu } from "@/components/AccountMenu";
import { WebgMark } from "@/components/WebgMark";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const admin = isAdminEmail(user.email);
  const supportUnreadCount = await getUserUnreadCount(user.id);
  return (
    <div className="min-h-screen bg-paper">
      <a href="#main-content" className="sr-only rounded-lg bg-white px-4 py-3 font-semibold focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50">
        דלגו לתוכן הראשי
      </a>
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" aria-label="WEBG - האתרים שלי" className="flex min-h-11 items-center"><WebgMark /></Link>
          <AccountMenu email={user.email} logoutAction={logoutAction} isAdmin={admin} supportUnreadCount={supportUnreadCount} />
        </div>
      </header>
      <div id="main-content" tabIndex={-1} className="outline-none">{children}</div>
    </div>
  );
}
