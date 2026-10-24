"use client";

import { useId, useRef } from "react";
import { COLOR_SWATCHES, contrastWithWhite, hexToHsl, hslToHex, isHexColor, readableOn } from "@/lib/color";
import { cx } from "../ui/ui";

/**
 * A new hue that keeps the current color's character, except where that would make the slider useless:
 * a near-gray (low saturation) or a near-black / near-white color would only ever produce more of the same.
 */
function hueShift(hue: number, s: number, l: number): string {
  if (s < 25) return hslToHex(hue, 70, 42);
  return hslToHex(hue, s, Math.min(Math.max(l, 30), 70));
}

/**
 * The wizard's color picker: a large live swatch ("orb"), ready-made colors as an accessible radio group,
 * a hue slider that keeps the current color's own saturation and lightness, an exact-color fallback, and a
 * readability readout. The readout is truthful: templates pick button text by contrast (readableOn), so a
 * light color really does get dark button text.
 */
export function ColorStudio({
  label,
  hint,
  value,
  onChange,
  allowNone,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
}) {
  const labelId = useId();
  const hueId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const has = isHexColor(value);
  const options = [...(allowNone ? [{ hex: "", name: "ללא" }] : []), ...COLOR_SWATCHES];
  const current = options.findIndex((o) => o.hex === value.toLowerCase());
  const [h, s, l] = has ? hexToHsl(value) : [220, 72, 45];
  const ratio = has ? contrastWithWhite(value) : 0;
  const textOn = has ? readableOn(value) : "#111827";

  function pickByKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowLeft" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].hex);
    requestAnimationFrame(() => (groupRef.current?.children[next] as HTMLElement | undefined)?.focus());
  }

  return (
    <div className="space-y-3">
      <div>
        <p id={labelId} className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="text-sm text-ink-500">{hint}</p>
      </div>

      <div className="grid items-center gap-5 rounded-2xl border border-ink-100 bg-ink-50 p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        {/* The orb: the chosen color, lit like an object rather than a flat chip. */}
        <div
          aria-hidden
          className={cx(
            "mx-auto grid h-24 w-24 place-items-center rounded-full font-mono text-xs transition-[background,box-shadow] duration-500",
            !has && "border-2 border-dashed border-ink-300 text-ink-500",
          )}
          style={
            has
              ? {
                  background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${value} 55%, #fff) 0%, ${value} 55%, color-mix(in srgb, ${value} 70%, #000) 100%)`,
                  boxShadow: `0 16px 34px -14px color-mix(in srgb, ${value} 75%, transparent)`,
                  color: textOn,
                }
              : undefined
          }
        >
          {has ? <span dir="ltr">{value.toUpperCase()}</span> : "ללא"}
        </div>

        <div className="min-w-0 space-y-4">
          <div ref={groupRef} role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2.5">
            {options.map((o, i) => {
              const on = i === current;
              return (
                <button
                  key={o.hex || "none"}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={o.name}
                  tabIndex={on || (current < 0 && i === 0) ? 0 : -1}
                  onClick={() => onChange(o.hex)}
                  onKeyDown={(e) => pickByKey(e, i)}
                  className={cx(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition duration-200 hover:scale-110",
                    o.hex ? "shadow-sm" : "border-2 border-dashed border-ink-300 bg-white text-[10px] text-ink-500",
                    on && "scale-110 ring-2 ring-ink-900 ring-offset-2 ring-offset-ink-50",
                  )}
                  style={o.hex ? { background: o.hex, color: readableOn(o.hex) } : undefined}
                >
                  {on ? <span aria-hidden className="webg-pop">✓</span> : !o.hex && "ללא"}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={hueId} className="text-sm font-semibold text-ink-900">גוון מדויק</label>
            <input
              id={hueId}
              type="range"
              dir="ltr"
              min={0}
              max={359}
              step={1}
              value={h}
              aria-valuetext={has ? value.toUpperCase() : "ללא צבע"}
              onChange={(e) => onChange(hueShift(Number(e.target.value), s, l))}
              className="webg-hue w-full"
              style={{ "--thumb": has ? value : "#ffffff" } as React.CSSProperties}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 font-semibold text-ink-800 focus-within:outline focus-within:outline-2 focus-within:outline-brand-600">
              קוד צבע מדויק
              <input type="color" aria-label={`${label}: קוד צבע מדויק`} value={has ? value : "#2563eb"} onChange={(e) => onChange(e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" />
            </label>
            {has && (
              <span aria-live="polite" className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-ink-500" dir="ltr">{ratio.toFixed(1)}:1</span>
                <span
                  className="rounded-lg px-3 py-1 text-xs font-semibold"
                  style={{ background: value, color: textOn }}
                >
                  קבעו תור
                </span>
                <span className={cx("text-xs font-medium", textOn === "#ffffff" && ratio < 4.5 ? "text-amber-700" : textOn === "#ffffff" ? "text-green-700" : "text-ink-600")}>
                  {textOn !== "#ffffff"
                    ? "צבע בהיר: טקסט הכפתורים יהיה כהה, כדי שיישאר קריא"
                    : ratio >= 4.5
                      ? "טקסט לבן קריא על הצבע ✓"
                      : "גוון בינוני: גוון קצת כהה יותר יהיה קריא יותר"}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
