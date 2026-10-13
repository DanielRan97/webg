"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "../ui/ui";

const LINKS = [
  { href: "/admin", label: "סקירה" },
  { href: "/admin/users", label: "משתמשים" },
  { href: "/admin/sites", label: "אתרים" },
  { href: "/admin/traffic", label: "תנועה" },
  { href: "/admin/interactions", label: "פניות" },
  { href: "/admin/support", label: "תמיכה" },
  { href: "/admin/purchases", label: "רכישות" },
] as const;

export function AdminNav({ supportUnreadCount = 0 }: { supportUnreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cx(
              "flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
              active ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-50",
            )}
          >
            {l.label}
            {l.href === "/admin/support" && supportUnreadCount > 0 && (
              <span aria-hidden className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{supportUnreadCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
