"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { WHOLE_COUNTRY } from "@/lib/constants";
import { splitAddress } from "@/lib/field-format";
import { Field, cx, inputClass } from "../ui/ui";

/*
 * City, street and area pickers backed by the government lists (see lib/places.ts and /api/places).
 * Everything is picked from those lists - typing only searches them. The server checks the same rule
 * on the final save (see strayAreaError / addressError in server/actions/sites.ts).
 */

interface City {
  code: number;
  name: string;
}

interface Places {
  cities: City[];
  regions: string[];
}

let placesPromise: Promise<Places | null> | null = null;
const streetsCache = new Map<number, Promise<string[] | null>>();

function loadPlaces(): Promise<Places | null> {
  placesPromise ??= fetch("/api/places/cities")
    .then((r) => (r.ok ? r.json() : null))
    .then((j: Partial<Places> | null) => (j?.cities && j.regions ? { cities: j.cities, regions: j.regions } : null))
    .catch(() => null)
    .then((places) => {
      if (!places) placesPromise = null; // let a later mount try again
      return places;
    });
  return placesPromise;
}

function loadStreets(code: number): Promise<string[] | null> {
  let p = streetsCache.get(code);
  if (!p) {
    p = fetch(`/api/places/streets?city=${code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { streets?: string[] } | null) => j?.streets ?? null)
      .catch(() => null);
    streetsCache.set(code, p);
  }
  return p;
}

/**
 * Names compared loosely: no quotes, dashes or extra spaces ("תל אביב יפו" finds "תל אביב - יפו"), and
 * full or short spelling alike ("קריית" finds the list's "קרית").
 */
const norm = (s: string) =>
  s.replace(/["'״׳`\-–()]/g, " ").replace(/יי/g, "י").replace(/וו/g, "ו").replace(/\s+/g, " ").trim();

/** `places`: undefined while loading, null if the lists couldn't be loaded (then `retry`). */
function usePlaces() {
  const [places, setPlaces] = useState<Places | null | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadPlaces().then((p) => live && setPlaces(p));
    return () => {
      live = false;
    };
  }, [attempt]);
  const retry = () => {
    setPlaces(undefined);
    setAttempt((n) => n + 1);
  };
  return { places, retry };
}

function useStreets(code: number | undefined) {
  const [result, setResult] = useState<{ code: number; streets: string[] | null } | null>(null);
  useEffect(() => {
    if (!code) return;
    let live = true;
    loadStreets(code).then((streets) => live && setResult({ code, streets }));
    return () => {
      live = false;
    };
  }, [code]);
  return code && result?.code === code ? result.streets : null;
}

const findCity = (cities: City[] | null, name: string) => {
  const n = norm(name);
  return n ? cities?.find((c) => norm(c.name) === n) : undefined;
};

/** Up to 8 matches: an exact match first, then names that start with what was typed, then the rest. */
function matches(options: string[], query: string): string[] {
  const q = norm(query);
  if (!q) return [];
  const exact: string[] = [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const o of options) {
    const n = norm(o);
    if (n === q) exact.push(o);
    else if (n.startsWith(q)) starts.push(o);
    else if (n.includes(q)) contains.push(o);
  }
  return [...exact, ...starts, ...contains].slice(0, 8);
}

/**
 * Text input with a suggestion list (ARIA combobox). Arrow keys move through suggestions, Enter picks,
 * Escape closes. `onPick` runs on a picked suggestion.
 */
function Combobox({
  label,
  hint,
  note,
  value,
  onChange,
  onPick,
  pickFirstOnEnter,
  options,
  placeholder,
  disabled,
  maxLength,
  onBlurField,
}: {
  label: string;
  hint?: string;
  /** A soft, non-blocking remark under the field (e.g. "not in the list"). */
  note?: string;
  value: string;
  onChange: (v: string) => void;
  onPick?: (v: string) => void;
  /** Enter with nothing highlighted picks the first suggestion. */
  pickFirstOnEnter?: boolean;
  options: string[] | null;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  /** Runs when the field loses focus (after any pick). */
  onBlurField?: () => void;
}) {
  const listId = useId();
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useMemo(() => (options ? matches(options, value) : []), [options, value]);
  // Nothing to suggest when the only match is exactly what's already typed.
  const shown = open && list.length > 0 && !(list.length === 1 && norm(list[0]) === norm(value));

  function pick(v: string) {
    if (onPick) onPick(v);
    else onChange(v);
    setOpen(false);
    setActive(-1);
  }

  return (
    <Field label={label} hint={hint}>
      {(p) => (
        <div className="relative">
          <input
            {...p}
            role="combobox"
            aria-expanded={shown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
            aria-describedby={[p["aria-describedby"], note && noteId].filter(Boolean).join(" ") || undefined}
            autoComplete="off"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              p.onBlur();
              setOpen(false);
              onBlurField?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && list.length) {
                e.preventDefault();
                setOpen(true);
                setActive((i) => (i + 1) % list.length);
              } else if (e.key === "ArrowUp" && list.length) {
                e.preventDefault();
                setActive((i) => (i <= 0 ? list.length - 1 : i - 1));
              } else if (e.key === "Enter") {
                if (shown && active >= 0) {
                  e.preventDefault();
                  pick(list[active]);
                } else if (pickFirstOnEnter && list.length) {
                  e.preventDefault();
                  pick(list[0]);
                }
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className={inputClass}
          />
          <ul
            id={listId}
            role="listbox"
            aria-label={`הצעות ל${label}`}
            className={cx(
              "absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-ink-200 bg-white py-1 shadow-[0_18px_40px_-20px_rgb(15_27_48/0.45)]",
              !shown && "hidden",
            )}
          >
            {list.map((o, i) => (
              <li
                key={o}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: picking must happen before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={cx("cursor-pointer px-4 py-2.5 text-sm", i === active ? "bg-brand-50 text-brand-800" : "text-ink-900")}
              >
                {o}
              </li>
            ))}
          </ul>
          {note && <p id={noteId} className="mt-1.5 text-sm text-amber-700">{note}</p>}
        </div>
      )}
    </Field>
  );
}

/**
 * A combobox whose value can only be a name from `options`: typing searches, picking commits. Leaving
 * the field with text that isn't a picked name puts the last picked value back (an empty field clears it).
 */
function ListOnlyField({
  label,
  hint,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | null;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  const [warn, setWarn] = useState("");
  // Follow a value changed from outside (e.g. the street cleared when the city changes).
  if (value !== seen) {
    setSeen(value);
    setText(value);
  }
  const inList = (v: string) => Boolean(options?.includes(v));
  return (
    <Combobox
      label={label}
      hint={hint}
      note={warn || (value && options && !inList(value) ? "הערך השמור לא מהרשימה הרשמית. בחרו מהרשימה." : undefined)}
      value={text}
      onChange={(v) => {
        setText(v);
        setWarn("");
      }}
      onPick={(v) => {
        setText(v);
        setWarn("");
        onChange(v);
      }}
      pickFirstOnEnter
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={100}
      onBlurField={() => {
        if (!text.trim()) {
          if (value) onChange("");
          return;
        }
        if (text !== value) {
          setText(value);
          setWarn(`״${text.trim()}״ לא ברשימה. מתחילים להקליד ובוחרים מהרשימה.`);
        }
      }}
    />
  );
}

/**
 * The business address, from the official lists only: a city, then a street of that city and a house
 * number. Changing the city clears the street. A locality with no official street list keeps just the
 * locality. Saved into the same `city` and `address` fields as before.
 */
export function AddressFields({
  city,
  address,
  onChange,
}: {
  city: string;
  address: string;
  onChange: (patch: { city?: string; address?: string }) => void;
}) {
  const { places, retry } = usePlaces();
  const cities = places?.cities ?? null;
  const cityMatch = findCity(cities, city);
  const streets = useStreets(cityMatch?.code);
  const { street, number } = splitAddress(address);
  const noStreets = Boolean(cityMatch && streets && streets.length === 0);

  return (
    <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">כתובת העסק (לא חובה)</p>
        <p className="text-sm text-ink-500">כדי שלקוחות ידעו איך להגיע. מתחילים להקליד ובוחרים מהרשימה הרשמית: קודם עיר, ואז רחוב ומספר.</p>
      </div>
      {places === null && <ListError onRetry={retry} />}
      <ListOnlyField
        label="עיר או יישוב"
        placeholder={places === undefined ? "טוענים את הרשימה..." : "לדוגמה: חיפה"}
        value={city}
        onChange={(v) => onChange(v === city ? { city: v } : { city: v, address: "" })}
        options={cities ? cities.map((c) => c.name) : null}
        disabled={!cities}
      />
      {noStreets ? (
        <p className="text-sm text-ink-700">ליישוב הזה אין רשימת רחובות רשמית, ולכן באתר יופיע שם היישוב בלבד.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <ListOnlyField
            label="רחוב"
            hint={cityMatch ? undefined : "אחרי שתבחרו עיר מהרשימה, תוכלו לבחור רחוב."}
            placeholder={cityMatch && !streets ? "טוענים את הרחובות..." : "לדוגמה: הרצל"}
            value={street}
            onChange={(v) => onChange({ address: v ? [v, number].filter(Boolean).join(" ") : "" })}
            options={streets}
            disabled={!cityMatch || !streets}
          />
          <Field label="מספר">
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                dir="ltr"
                value={number}
                disabled={!street}
                onChange={(e) => {
                  const n = e.target.value.replace(/[^\d/א-ת]/g, "").slice(0, 8);
                  onChange({ address: [street, n].filter(Boolean).join(" ") });
                }}
                placeholder="10"
                className={inputClass}
              />
            )}
          </Field>
        </div>
      )}
    </div>
  );
}

function ListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
      <span>לא הצלחנו לטעון את רשימת הערים והאזורים. בלי הרשימה אי אפשר לבחור.</span>
      <button type="button" onClick={onRetry} className="min-h-10 rounded-lg border border-red-300 bg-white px-4 font-semibold text-red-800 hover:bg-red-100">
        נסו שוב
      </button>
    </div>
  );
}

type AreaMode = "country" | "regions" | "cities";
const AREA_MODES: { mode: AreaMode; label: string; hint: string }[] = [
  { mode: "country", label: "כל הארץ", hint: "מגיעים לכל מקום בארץ" },
  { mode: "regions", label: "לפי אזורים", hint: "מחוזות, נפות ומועצות אזוריות" },
  { mode: "cities", label: "לפי ערים", hint: "ערים ויישובים מסוימים" },
];

/**
 * Service or delivery areas, from the official lists only. The owner first says how they cover the
 * country - everywhere, by regions (districts, sub-districts, regional councils) or by cities - and then
 * picks from that list alone. Switching between regions and cities keeps only names of the chosen kind.
 */
export function AreaPicker({
  label,
  values,
  onChange,
  max,
  emptyText,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
  emptyText: string;
}) {
  const { places, retry } = usePlaces();
  const [choice, setChoice] = useState<AreaMode | null>(null);
  const [draft, setDraft] = useState("");
  const regions = useMemo(() => (places ? places.regions.filter((r) => r !== WHOLE_COUNTRY) : null), [places]);
  const cityNames = useMemo(() => (places ? places.cities.map((c) => c.name) : null), [places]);

  // What the saved values already say, until the owner picks a way themselves.
  const inferred: AreaMode | null = values.includes(WHOLE_COUNTRY)
    ? "country"
    : values.length === 0
      ? null
      : regions && values.some((v) => regions.includes(v))
        ? "regions"
        : "cities";
  const mode = choice ?? inferred;
  const list = mode === "regions" ? regions : mode === "cities" ? cityNames : null;
  const options = useMemo(() => (list ? list.filter((n) => !values.includes(n)) : null), [list, values]);
  const full = values.length >= max;

  function chooseMode(next: AreaMode) {
    setChoice(next);
    setDraft("");
    if (next === "country") {
      onChange([WHOLE_COUNTRY]);
      return;
    }
    const kind = next === "regions" ? regions : cityNames;
    // Keep only names of the chosen kind ("כל הארץ" and the other kind are dropped).
    onChange(values.filter((v) => kind?.includes(v)));
  }

  function add(name: string) {
    setDraft("");
    if (!options?.includes(name) || values.length >= max) return;
    onChange([...values, name]);
  }

  return (
    <div className="space-y-3">
      {places === null && <ListError onRetry={retry} />}
      <div role="radiogroup" aria-label={`${label}: איך לבחור`} className="grid gap-2 sm:grid-cols-3">
        {AREA_MODES.map((m) => {
          const selected = mode === m.mode;
          return (
            <button
              key={m.mode}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!places}
              onClick={() => chooseMode(m.mode)}
              className={cx(
                "rounded-xl border p-3 text-start transition disabled:opacity-50",
                selected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/20" : "border-ink-200 bg-white hover:border-ink-400",
              )}
            >
              <span className="block font-semibold text-ink-900">{m.label}</span>
              <span className="block text-xs text-ink-500">{m.hint}</span>
            </button>
          );
        })}
      </div>

      {mode === "country" && <p className="text-sm text-ink-700">באתר יופיע שאתם מגיעים לכל הארץ.</p>}

      {(mode === "regions" || mode === "cities") && (
        <>
          <Combobox
            label={mode === "regions" ? "אזור" : "עיר או יישוב"}
            hint={mode === "regions" ? "מתחילים להקליד ובוחרים מהרשימה: מחוז, נפה או מועצה אזורית." : "מתחילים להקליד ובוחרים מהרשימה הרשמית."}
            placeholder={mode === "regions" ? "לדוגמה: נפת השרון או מחוז הצפון" : "לדוגמה: חיפה"}
            value={draft}
            onChange={setDraft}
            onPick={add}
            pickFirstOnEnter
            options={options}
            note={
              options && norm(draft).length >= 2 && !options.some((o) => norm(o).includes(norm(draft)))
                ? `לא מצאנו את ״${draft.trim()}״ ברשימה של ה${mode === "regions" ? "אזורים" : "ערים"}.${mode === "cities" ? " אם זה אזור, בחרו ״לפי אזורים״." : " אם זו עיר, בחרו ״לפי ערים״."}`
                : undefined
            }
            disabled={full || !options}
            maxLength={60}
          />
          {values.length === 0 ? (
            <p className="text-sm text-ink-500">{emptyText}</p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label={`${label}: מה שהוספתם`}>
              {values.map((a, i) => (
                <li key={a} className="flex items-center gap-1 rounded-full border border-ink-200 bg-white ps-4">
                  <span className="py-2 text-sm">{a}</span>
                  <button
                    type="button"
                    aria-label={`הסרת ${a}`}
                    onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-ink-500 hover:bg-ink-100"
                  >
                    <span aria-hidden>×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
