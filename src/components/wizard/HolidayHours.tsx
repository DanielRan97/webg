"use client";

import { HOLIDAY_SUGGESTIONS } from "@/lib/constants";
import type { HolidayHourData, SiteData } from "@/types/site";
import { Button, TextField, Toggle, cx, inputClass } from "../ui/ui";
import { TrashIcon } from "../ui/icons";

const MAX = 20;
const EMPTY: HolidayHourData = { name: "", date: "", isOpen: false, openTime: "", closeTime: "" };

/**
 * Special hours for specific holidays ("ערב ראש השנה: 08:00-13:00", "יום כיפור: סגור"), under the weekly
 * hours. Optional: one tap adds a common holiday, or any other name can be typed. Closed unless switched open.
 */
export function HolidayHours({ data, update, errors }: { data: SiteData; update: (patch: Partial<SiteData>) => void; errors: Record<string, string> }) {
  const list = data.holidayHours;
  const set = (i: number, patch: Partial<HolidayHourData>) => update({ holidayHours: list.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) });
  const add = (name: string) => update({ holidayHours: [...list, { ...EMPTY, name }] });
  const used = new Set(list.map((h) => h.name.trim()));
  const suggestions = HOLIDAY_SUGGESTIONS.filter((n) => !used.has(n));
  const full = list.length >= MAX;

  return (
    <div className="space-y-3 rounded-xl border border-ink-100 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">שעות מיוחדות בחגים (לא חובה)</p>
        <p className="text-sm text-ink-500">למשל ערב חג שבו סוגרים מוקדם, או חג שבו סגור. מה שתוסיפו כאן יופיע באתר מתחת לשעות הרגילות.</p>
      </div>

      {list.length > 0 && (
        <ul className="space-y-2">
          {list.map((h, i) => {
            const err = errors[`holiday-${i}`];
            return (
              <li key={i} className={cx("space-y-3 rounded-xl border p-3", h.isOpen ? "border-green-200 bg-green-50" : "border-ink-100 bg-ink-50")}>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end">
                  <TextField label="שם החג" list="holiday-names" placeholder="לדוגמה: ערב ראש השנה" value={h.name} onChange={(v) => set(i, { name: v })} maxLength={40} />
                  <TextField label="תאריך (לא חובה)" type="date" dir="ltr" value={h.date} onChange={(v) => set(i, { date: v })} />
                  <button
                    type="button"
                    aria-label={`מחיקת ${h.name.trim() || `חג ${i + 1}`}`}
                    onClick={() => update({ holidayHours: list.filter((_, idx) => idx !== i) })}
                    className="flex h-11 w-11 items-center justify-center justify-self-end rounded-lg text-red-600 transition hover:bg-red-100"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-44 flex-1">
                    <Toggle checked={h.isOpen} onChange={(v) => set(i, { isOpen: v })} label={`פתוחים ב${h.name.trim() || "חג הזה"}?`} onText="פתוח" offText="סגור" />
                  </div>
                  {h.isOpen && (
                    <div className="flex items-center gap-2" dir="ltr">
                      <input aria-label={`שעת פתיחה ב${h.name || "חג"}`} aria-invalid={err ? true : undefined} type="time" value={h.openTime} onChange={(e) => set(i, { openTime: e.target.value })} className={`${inputClass} w-32`} />
                      <span aria-hidden className="text-ink-400">–</span>
                      <input aria-label={`שעת סגירה ב${h.name || "חג"}`} aria-invalid={err ? true : undefined} type="time" value={h.closeTime} onChange={(e) => set(i, { closeTime: e.target.value })} className={`${inputClass} w-32`} />
                    </div>
                  )}
                </div>
                {err && <p role="alert" className="flex gap-1.5 text-sm font-medium text-red-700"><span aria-hidden>⚠</span>{err}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <datalist id="holiday-names">{suggestions.map((n) => <option key={n} value={n} />)}</datalist>
      {!full && (
        <div className="space-y-2">
          <p className="text-xs text-ink-500">הוספה מהירה:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 10).map((n) => (
              <button key={n} type="button" onClick={() => add(n)} className="min-h-9 rounded-full border border-ink-200 bg-white px-3 text-xs font-semibold text-ink-800 transition hover:bg-ink-50">
                + {n}
              </button>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={() => add("")}>+ חג או יום מיוחד אחר</Button>
        </div>
      )}
    </div>
  );
}
