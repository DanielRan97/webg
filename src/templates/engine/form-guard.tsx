"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormGuard } from "@/lib/form-guard";
import { LockIcon } from "../shared/Icons";

/**
 * The client half of lib/form-guard: a field only bots fill, and when the form appeared. `guard()` is
 * what each submission sends along.
 */
export function useFormGuard() {
  const [trap, setTrap] = useState("");
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);
  const guard = (): FormGuard => ({ trap, elapsedMs: shownAt.current ? Date.now() - shownAt.current : 0 });
  return { trap, setTrap, guard };
}

/** Clipped to nothing, out of the tab order and hidden from screen readers - a person never meets it. */
export function TrapField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-0 h-px w-px overflow-hidden opacity-0 [clip-path:inset(50%)]">
      <label htmlFor={id}>השאירו שדה זה ריק</label>
      <input id={id} name="website_url" type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Under the send button: where the details go and why, said plainly. */
export function FormTrustNote({ businessName }: { businessName: string }) {
  return (
    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-t-muted">
      <LockIcon width={14} height={14} className="mt-0.5 shrink-0" />
      <span>הפרטים נשלחים בחיבור מאובטח ישירות אל {businessName || "בית העסק"}, ומשמשים רק כדי לחזור אליכם.</span>
    </p>
  );
}
