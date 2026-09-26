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
  { href: "/admin/purchases", label: "רכישות" },
] as const;

export function AdminNav() {
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
              "flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition",
              active ? "bg-indigo-100 text-indigo-900" : "text-gray-700 hover:bg-gray-100",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
