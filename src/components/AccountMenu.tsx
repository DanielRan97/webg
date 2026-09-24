"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "./ui/icons";

/** Compact account menu for the top nav: avatar + chevron trigger, email and logout inside. */
export function AccountMenu({ email, logoutAction }: { email: string; logoutAction: () => void }) {
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
        className="flex min-h-11 items-center gap-1.5 rounded-xl px-1.5 text-gray-700 transition hover:bg-gray-100"
      >
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-800">
          {initial}
        </span>
        <ChevronDownIcon className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-50 mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
          <p className="truncate rounded-lg px-3 py-2 text-sm text-gray-600" dir="ltr">{email}</p>
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className="flex min-h-11 w-full items-center rounded-lg px-3 text-start font-semibold text-gray-900 hover:bg-gray-100">
              התנתקות
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
