"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { WHOLE_COUNTRY } from "@/lib/constants";
import { Field, cx, inputClass } from "../ui/ui";

/*
 * City, street and area pickers backed by the government lists (see lib/places.ts and /api/places).
 * The address suggests without blocking (a place missing from the list can still be typed, with a note
 * to check the spelling). Service/delivery areas are picked from the list only - unless it can't load.
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

/** undefined while loading, null if the lists couldn't be loaded. */
function usePlaces() {
  const [places, setPlaces] = useState<Places | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    loadPlaces().then((p) => live && setPlaces(p));
    return () => {
      live = false;
    };
  }, []);
  return places;
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
 * Escape closes. `onPick` runs on a picked suggestion - or, with `pickOnEnter`, on Enter with free text.
 */
function Combobox({
  label,
  hint,
  note,
  value,
  onChange,
  onPick,
  pickOnEnter,
  pickFirstOnEnter,
  options,
  placeholder,
  disabled,
  maxLength,
}: {
  label: string;
  hint?: string;
  /** A soft, non-blocking remark under the field (e.g. "not in the list"). */
  note?: string;
  value: string;
  onChange: (v: string) => void;
  onPick?: (v: string) => void;
  /** Enter with nothing highlighted adds the typed text as is. */
  pickOnEnter?: boolean;
  /** Enter with nothing highlighted picks the first suggestion. */
  pickFirstOnEnter?: boolean;
  options: string[] | null;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
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
                } else if (pickOnEnter && value.trim()) {
                  e.preventDefault();
                  pick(value.trim());
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

const NOT_IN_LIST = "לא מצאנו את זה ברשימה הרשמית. אפשר להשאיר כך, אבל כדאי לבדוק את האיות.";

/** "הרצל 10" -> street "הרצל", number "10". A number may carry a letter or a slash ("12א", "4/2"). */
function splitAddress(address: string): { street: string; number: string } {
  const m = address.trim().match(/^(.*\S)\s+(\d+[א-ת]?(?:\/\d+)?)$/);
  return m ? { street: m[1], number: m[2] } : { street: address.trim(), number: "" };
}

/**
 * The business address: city first (from the official list), then a street from that city's list and
 * a house number. Saved into the same `city` and `address` fields as before.
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
  const places = usePlaces();
  const cities = places?.cities ?? null;
  const cityMatch = findCity(cities, city);
  const streets = useStreets(cityMatch?.code);
  // Kept apart while typing (re-splitting the saved string would eat a trailing space mid-word, e.g. "בן ").
  const [parts, setParts] = useState(() => splitAddress(address));
  const { street, number } = parts;
  const setAddress = (s: string, n: string) => {
    setParts({ street: s, number: n });
    onChange({ address: n.trim() ? `${s.trim()} ${n.trim()}` : s });
  };
  const streetKnown = !street || !streets || streets.some((s) => norm(s) === norm(street));

  return (
    <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">כתובת העסק (לא חובה)</p>
        <p className="text-sm text-ink-500">כדי שלקוחות ידעו איך להגיע. מתחילים להקליד ובוחרים מהרשימה הרשמית של ערים ורחובות.</p>
      </div>
      <Combobox
        label="עיר או יישוב"
        placeholder="לדוגמה: חיפה"
        value={city}
        onChange={(v) => onChange({ city: v })}
        options={cities ? cities.map((c) => c.name) : null}
        note={city.trim() && cities && !cityMatch ? NOT_IN_LIST : undefined}
        maxLength={60}
      />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <Combobox
          label="רחוב"
          hint={cityMatch ? undefined : "אחרי שתבחרו עיר, נציע את הרחובות שלה."}
          placeholder="לדוגמה: הרצל"
          value={street}
          onChange={(v) => setAddress(v, number)}
          options={streets}
          note={streetKnown ? undefined : NOT_IN_LIST}
          maxLength={100}
        />
        <Field label="מספר">
          {(p) => (
            <input
              {...p}
              inputMode="numeric"
              dir="ltr"
              value={number}
              onChange={(e) => setAddress(street, e.target.value.replace(/[^\d/א-ת]/g, "").slice(0, 8))}
              placeholder="10"
              className={inputClass}
            />
          )}
        </Field>
      </div>
    </div>
  );
}

/**
 * A list of cities/areas as removable chips, picked from the official lists: "כל הארץ", districts,
 * sub-districts, regional councils and cities. "כל הארץ" stands alone - picking it replaces the rest,
 * and picking anything else drops it. Only if the lists can't load may the owner type a name.
 */
export function AreaPicker({
  label,
  hint,
  values,
  onChange,
  max,
  emptyText,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
  emptyText: string;
}) {
  const places = usePlaces();
  const failed = places === null;
  const [draft, setDraft] = useState("");
  const full = values.length >= max;
  const options = useMemo(
    () => (places ? [...places.regions, ...places.cities.map((c) => c.name)].filter((n) => !values.includes(n)) : null),
    [places, values],
  );

  function add(raw: string) {
    const name = raw.trim();
    setDraft("");
    if (!name || values.some((v) => norm(v) === norm(name))) return;
    if (name === WHOLE_COUNTRY) onChange([WHOLE_COUNTRY]);
    else if (values.length < max) onChange([...values.filter((v) => v !== WHOLE_COUNTRY), name]);
  }

  return (
    <div className="space-y-3">
      <Combobox
        label={label}
        hint={failed ? "לא הצלחנו לטעון את רשימת הערים והאזורים כרגע. אפשר לכתוב שם וללחוץ Enter." : hint}
        placeholder="לדוגמה: חיפה, נפת השרון או כל הארץ"
        value={draft}
        onChange={setDraft}
        onPick={add}
        pickFirstOnEnter
        pickOnEnter={failed}
        options={options}
        note={
          options && norm(draft).length >= 2 && !options.some((o) => norm(o).includes(norm(draft)))
            ? `לא מצאנו את ״${draft.trim()}״ ברשימה. נסו שם של עיר, מועצה אזורית, נפה (למשל ״נפת תל אביב״) או מחוז.`
            : undefined
        }
        disabled={full}
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
    </div>
  );
}
