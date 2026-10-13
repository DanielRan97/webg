"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./ui/icons";

/** Compact account menu for the top nav: avatar + chevron trigger, email and logout inside. */
export function AccountMenu({
  email,
  logoutAction,
  isAdmin,
  supportUnreadCount,
}: {
  email: string;
  logoutAction: () => void;
  isAdmin?: boolean;
  /** Unread admin replies across the user's own support tickets - omitted (not 0) hides the badge entirely, so pages that don't fetch it never show a stale zero. */
  supportUnreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = email.trim()[0]?.toUpperCase() ?? "•";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="תפריט חשבון"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-1.5 rounded-lg px-1.5 text-ink-700 transition hover:bg-ink-50"
      >
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-800">
          {initial}
        </span>
        <ChevronDownIcon className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-50 mt-2 w-60 rounded-xl border border-ink-200 bg-white p-1.5 shadow-lg">
          <p className="truncate rounded-lg px-3 py-2 text-sm text-ink-500" dir="ltr">{email}</p>
          {isAdmin && (
            <Link href="/admin" role="menuitem" className="flex min-h-11 w-full items-center rounded-lg px-3 text-start font-semibold text-ink-900 hover:bg-ink-50">
              אדמין
            </Link>
          )}
          <Link href="/support" role="menuitem" className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-start font-semibold text-ink-900 hover:bg-ink-50">
            <span>עזרה / צור קשר</span>
            {Boolean(supportUnreadCount) && (
              <span aria-hidden className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{supportUnreadCount}</span>
            )}
          </Link>
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className="flex min-h-11 w-full items-center rounded-lg px-3 text-start font-semibold text-ink-900 hover:bg-ink-50">
              התנתקות
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
