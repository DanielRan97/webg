"use client";

import { useEffect, useState } from "react";
import { cx } from "../ui/ui";

const STEP_MS = 380;
const SETTLE_MS = 500;

/**
 * A small floating "build status" panel beside the home page's live preview. Every time the visitor
 * changes the name, type or color (`signature`), it waits for typing to settle and then ticks through a
 * short checklist - only things WEBG really does for every site. Decorative: hidden from screen readers,
 * and under reduced motion it simply shows every step done.
 */
export function BuildStatus({ address, signature }: { address: string; signature: string }) {
  const steps = [
    { label: "כתובת", value: address, mono: true },
    { label: "חיבור HTTPS מאובטח" },
    { label: "מותאם לטלפון ולמחשב" },
    { label: "מוכן לפרסום" },
  ];
  const [done, setDone] = useState(steps.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    // Restart from zero once the visitor pauses; every step then ticks after the previous one.
    const start = setTimeout(() => {
      let n = 0;
      setDone(0);
      const tick = () => {
        n += 1;
        setDone(n);
        if (n < 4) timer = setTimeout(tick, STEP_MS);
      };
      timer = setTimeout(tick, STEP_MS);
    }, SETTLE_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(timer);
    };
  }, [signature]);

  const building = done < steps.length;
  return (
    <div aria-hidden className="w-72 rounded-2xl border border-white/10 bg-ink-950/80 p-3.5 text-xs text-ink-200 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between font-mono text-[10px] tracking-wide text-ink-400">
        <span>build status</span>
        <span className={cx("flex items-center gap-1.5", building ? "text-cyan-300" : "text-emerald-400")}>
          <span className={cx("h-1.5 w-1.5 rounded-full", building ? "animate-pulse bg-cyan-300" : "webg-live-dot bg-emerald-400")} />
          {building ? "בונים..." : "מוכן"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {steps.map((s, i) => {
          const ok = i < done;
          const active = i === done;
          return (
            <li key={s.label} className={cx("flex items-start gap-2 transition-opacity duration-300", ok || active ? "opacity-100" : "opacity-40")}>
              <span
                className={cx(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold",
                  ok ? "webg-pop bg-emerald-500 text-white" : active ? "border-2 border-cyan-300 border-t-transparent animate-spin" : "border border-white/20",
                )}
              >
                {ok && "✓"}
              </span>
              <span className="min-w-0">
                <span className="block">{s.label}</span>
                {s.value && <span dir="ltr" className="block truncate font-mono text-[10px] text-cyan-200">{s.value}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
