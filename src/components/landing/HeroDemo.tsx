"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { emptySiteData } from "@/lib/site-defaults";
import { SLUG_BASE, slugify } from "@/lib/slug-format";
import { readableOn } from "@/lib/color";
import type { TemplateId } from "@/lib/constants";
import { PreviewPane } from "../wizard/PreviewPane";
import { ShieldIcon } from "../icons";
import { ComingNext } from "../ComingNext";
import { cx } from "../ui/ui";

/** Each business type shows off a different standard template, so the demo also shows the range. */
const TYPES: { id: string; label: string; template: TemplateId }[] = [
  { id: "barber", label: "ספר", template: "dark" },
  { id: "cafe", label: "בית קפה", template: "elegant" },
  { id: "electrician", label: "חשמלאי", template: "bold" },
  { id: "lawyer", label: "עורך דין", template: "minimal" },
];

/** A taste of the wizard's color studio. `null` = the business type's own default color. */
const COLORS: { hex: string | null; name: string }[] = [
  { hex: null, name: "הצבע של סוג העסק" },
  { hex: "#2563eb", name: "כחול" },
  { hex: "#0f766e", name: "ירוק-כחול" },
  { hex: "#d97706", name: "כתום" },
  { hex: "#dc2626", name: "אדום" },
  { hex: "#7c3aed", name: "סגול" },
];

/** One staged entrance for the hero, in reading order. Rests fully visible; reduced motion skips it (globals.css). */
const rise = (step: number) => ({ animationDelay: `${step * 90}ms` });

/**
 * The home page hero, on a dark background: type a business name, pick a type and a color, and watch
 * the real WEBG renderer build the site - the wizard's own controls, in miniature.
 */
export function HeroDemo({ ctaHref }: { ctaHref: string }) {
  const inputId = useId();
  const colorLabelId = useId();
  const colorsRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState(TYPES[0].id);
  const [colorIndex, setColorIndex] = useState(0);
  const type = TYPES.find((t) => t.id === typeId) ?? TYPES[0];
  const color = COLORS[colorIndex].hex;

  const typeColor = useMemo(() => emptySiteData(type.id).primaryColor, [type]);
  const data = useMemo(
    () => ({ ...emptySiteData(type.id), businessName: name.trim(), templateId: type.template, primaryColor: color ?? typeColor }),
    [name, type, color, typeColor],
  );
  const address = SLUG_BASE + (slugify(name) || "your-business");
  const nameOk = name.trim().length >= 2;

  function pickColorByKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowLeft" ? 1 : -1) + COLORS.length) % COLORS.length;
    setColorIndex(next);
    requestAnimationFrame(() => (colorsRef.current?.children[next] as HTMLElement | undefined)?.focus());
  }

  return (
    <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
      <div>
        <p style={rise(0)} className="webg-rise inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-200">
          <ShieldIcon className="h-4 w-4" />
          כל אתר עולה עם חיבור HTTPS מאובטח
        </p>
        <h1 style={rise(1)} className="webg-rise mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          כותבים את שם{" "}העסק.
          <br />
          <span className="text-ink-300">האתר נבנה מולכם.</span>
        </h1>
        <p style={rise(2)} className="webg-rise mt-6 max-w-md text-xl leading-relaxed text-ink-300">
          ממלאים טופס.
          <br />
          מקבלים אתר.
        </p>

        <div style={rise(3)} className="webg-rise mt-10 max-w-md space-y-6">
          <div className="space-y-2">
            <label htmlFor={inputId} className="block text-sm font-semibold text-ink-200">איך קוראים לעסק?</label>
            <div className="relative">
              <input
                id={inputId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: מספרת דני"
                maxLength={40}
                autoComplete="off"
                className="min-h-14 w-full rounded-xl border border-white/10 border-b-2 border-b-white/40 bg-white/5 bg-no-repeat px-4 pe-12 text-lg text-white outline-none transition-[background-color,background-size,border-color] duration-500 ease-out placeholder:text-ink-500 [background-image:linear-gradient(90deg,#22b8cf,#8aa8ff)] [background-origin:border-box] [background-position:100%_100%] [background-size:0%_2px] hover:bg-white/10 focus:border-b-transparent focus:bg-brand-500/10 focus:[background-size:100%_2px] focus-visible:outline-none"
              />
              {nameOk && (
                <span aria-hidden className="webg-pop pointer-events-none absolute end-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
              )}
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-200">סוג העסק</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={t.id === typeId}
                  onClick={() => setTypeId(t.id)}
                  className={cx(
                    "min-h-11 rounded-lg border px-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5",
                    t.id === typeId
                      ? "border-brand-400 bg-brand-500/15 text-white shadow-[0_0_24px_-6px_rgb(90_130_245/0.65)]"
                      : "border-white/10 text-ink-300 hover:border-white/25 hover:text-white",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <p id={colorLabelId} className="mb-2 text-sm font-semibold text-ink-200">צבע</p>
            <div ref={colorsRef} role="radiogroup" aria-labelledby={colorLabelId} className="flex flex-wrap items-center gap-2.5">
              {COLORS.map((c, i) => {
                const on = i === colorIndex;
                const fill = c.hex ?? typeColor;
                return (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={c.name}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setColorIndex(i)}
                    onKeyDown={(e) => pickColorByKey(e, i)}
                    className={cx(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition duration-200 hover:scale-110",
                      !c.hex && "outline-2 outline-offset-2 outline-dashed outline-white/40",
                      on && "scale-110 ring-2 ring-white ring-offset-2 ring-offset-ink-950",
                    )}
                    style={{ background: fill, color: readableOn(fill) }}
                  >
                    {on && <span aria-hidden className="webg-pop">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <Link href={ctaHref} className="inline-flex min-h-14 items-center rounded-xl bg-brand-500 px-8 text-lg font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-400 hover:shadow-[0_10px_30px_-8px_rgb(90_130_245/0.7)] active:scale-[0.98]">
              יצירת האתר שלי
            </Link>
            <a href="#how" className="inline-flex min-h-11 items-center font-semibold text-ink-300 transition hover:text-white">איך זה עובד</a>
          </div>
        </div>
      </div>

      <div style={rise(4)} className="webg-rise relative mx-auto w-full max-w-[340px]">
        <div aria-hidden className="absolute inset-x-0 top-1/4 -z-0 mx-auto h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <p className="relative mb-3 flex items-center justify-center gap-2 text-xs font-medium text-ink-300">
          <span aria-hidden className="webg-live-dot h-2 w-2 rounded-full bg-emerald-400" />
          תצוגה חיה
        </p>
        <div className="relative rounded-[2rem] ring-1 ring-white/15">
          <PreviewPane data={data} address={address} frameClassName="h-[460px] md:h-[560px]" />
        </div>
        <p className="relative mt-4 text-center text-sm text-ink-400">תצוגה אמיתית של WEBG, באותה תבנית שתקבלו.</p>
        <div className="relative mt-3">
          <ComingNext tone="dark" />
        </div>
      </div>
    </div>
  );
}
