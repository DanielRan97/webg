"use client";

import { useRef, useState } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  NAV_PARTS,
  NAV_PART_LABELS,
  NAV_SLOTS,
  NAV_SLOT_LABELS,
  resolveNavLayout,
  serializeNavLayout,
  templateNavDefault,
  type NavLayout,
  type NavPart,
  type NavSlot,
} from "@/lib/nav-layout";
import type { SiteData } from "@/types/site";
import { cx } from "../ui/ui";

type Zone = (typeof NAV_SLOTS)[number];

const PART_HINTS: Record<NavPart, (d: SiteData) => string> = {
  logo: (d) => (d.logoUrl ? "הלוגו שהעליתם" : "הסימן שנוצר מהאות הראשונה"),
  name: (d) => d.businessName.trim() || "שם העסק",
  menu: () => "קישורים לחלקי האתר",
  call: (d) => (d.phone.trim() ? "מופיע רק בטלפון, ומחייג אליכם בלחיצה" : "יופיע אחרי שתמלאו טלפון בשלב ״פרטי העסק״"),
};

/** Shorter names for the chips on the board. */
const CHIP_LABELS: Record<NavPart, string> = { ...NAV_PART_LABELS, call: "התקשרו (בטלפון)" };

/** One part on the board. Pointer-only: the rows below are the keyboard and screen-reader path to the same choices. */
function Chip({ part, off }: { part: NavPart; off: boolean }) {
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({ id: part });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cx(
        "webg-pop flex cursor-grab touch-none select-none items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold shadow-sm active:cursor-grabbing",
        off ? "border-dashed border-ink-300 text-ink-400 line-through" : "border-ink-200 text-ink-900",
        isDragging && "relative z-10 shadow-lg ring-2 ring-brand-600",
      )}
    >
      <span aria-hidden className="font-mono text-xs text-ink-400">⋮⋮</span>
      {CHIP_LABELS[part]}
    </div>
  );
}

function DropZone({ id, label, className, children }: { id: Zone | "off"; label: string; className?: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cx(
        "flex min-h-14 flex-wrap content-start items-center gap-2 rounded-lg border border-dashed p-2 transition-colors",
        isOver ? "border-brand-600 bg-brand-50" : "border-ink-200",
        className,
      )}
    >
      <span className="w-full font-mono text-[11px] tracking-wide text-ink-400">{label}</span>
      {children}
    </div>
  );
}

/**
 * The owner's control over the site's top bar: show or hide the logo, the name and the menu, and
 * place each right / center / left. Saved as `navLayout`; until touched, the template's own default
 * applies (and keeps applying if the template changes).
 */
export function NavEditor({ data, update }: { data: SiteData; update: (patch: Partial<SiteData>) => void }) {
  const layout = resolveNavLayout(data.navLayout, data.templateId);
  const fallback = templateNavDefault(data.templateId);
  // Where a hidden part goes back to when shown again: its last zone in this session, else the template's choice.
  const lastZone = useRef<Partial<Record<NavPart, Zone>>>({});
  const [announcement, setAnnouncement] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function commit(next: NavLayout, message: string) {
    update({ navLayout: serializeNavLayout(next) });
    setAnnouncement(message);
  }

  function place(part: NavPart, slot: NavSlot) {
    if (layout[part] === slot) return;
    if (layout[part] !== "off") lastZone.current[part] = layout[part] as Zone;
    commit(
      { ...layout, [part]: slot },
      slot === "off" ? `${NAV_PART_LABELS[part]} הוסתר` : `${NAV_PART_LABELS[part]} עבר ל${NAV_SLOT_LABELS[slot]}`,
    );
  }

  function toggle(part: NavPart) {
    if (layout[part] === "off") {
      const back = lastZone.current[part] ?? (fallback[part] !== "off" ? fallback[part] : "start");
      place(part, back);
    } else {
      place(part, "off");
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over) place(active.id as NavPart, over.id as NavSlot);
  }

  const partsIn = (slot: NavSlot) => NAV_PARTS.filter((p) => layout[p] === slot);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">סרגל הניווט של האתר</p>
        <p className="text-sm text-ink-500">בחרו מה יופיע בפס העליון ואיפה. אפשר לגרור, או להשתמש בכפתורים שמתחת. כל חלק, גם כפתור ״התקשרו״, אפשר לכבות ולהחזיר בלחיצה.</p>
      </div>

      {/* Visual board: drag between the three zones of a desktop bar, or into "מוסתרים" to hide. */}
      <DndContext id="nav-editor" sensors={sensors} onDragEnd={onDragEnd}>
        <div aria-hidden className="rounded-xl border border-ink-200 bg-ink-50 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink-300" />
            <span className="h-2 w-2 rounded-full bg-ink-300" />
            <span className="ms-2 font-mono text-[11px] text-ink-400">כך הסרגל ייראה (כפתור התקשרו מופיע רק בטלפון)</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {NAV_SLOTS.map((slot) => (
              <DropZone key={slot} id={slot} label={NAV_SLOT_LABELS[slot]} className="bg-white">
                {partsIn(slot).map((p) => <Chip key={p} part={p} off={false} />)}
              </DropZone>
            ))}
          </div>
          <DropZone id="off" label="מוסתרים: גררו לכאן כדי להסתיר" className="mt-2">
            {partsIn("off").map((p) => <Chip key={p} part={p} off />)}
          </DropZone>
        </div>
      </DndContext>

      {/* The accessible controls for the same choices. */}
      <ul className="space-y-2">
        {NAV_PARTS.map((part) => {
          const on = layout[part] !== "off";
          const titleId = `nav-part-${part}`;
          return (
            <li key={part} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="min-w-0">
                <p id={titleId} className="font-semibold text-ink-900">{NAV_PART_LABELS[part]}</p>
                <p className="truncate text-xs text-ink-500">{PART_HINTS[part](data)}</p>
              </div>
              <div role="radiogroup" aria-labelledby={titleId} className="order-3 col-span-2 flex overflow-hidden rounded-lg border border-ink-200 sm:order-none sm:col-span-1">
                {NAV_SLOTS.map((slot) => {
                  const checked = layout[part] === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      disabled={!on}
                      tabIndex={checked || (!on && slot === "start") ? 0 : -1}
                      onClick={() => place(part, slot)}
                      onKeyDown={(e) => {
                        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                        e.preventDefault();
                        const i = NAV_SLOTS.indexOf(slot) + (e.key === "ArrowLeft" ? 1 : -1);
                        const next = NAV_SLOTS[i];
                        if (!next) return;
                        place(part, next);
                        const group = e.currentTarget.parentElement;
                        requestAnimationFrame(() => (group?.children[i] as HTMLElement | undefined)?.focus());
                      }}
                      className={cx(
                        "min-h-10 flex-1 px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none",
                        checked ? "bg-brand-600 text-white" : "bg-white text-ink-700 hover:bg-ink-50",
                        slot !== "start" && "border-s border-ink-200",
                      )}
                    >
                      {NAV_SLOT_LABELS[slot]}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`הצגת ${NAV_PART_LABELS[part]}`}
                onClick={() => toggle(part)}
                className={cx("webg-switch relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-brand-600" : "bg-ink-300")}
              >
                <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "start-6" : "start-1")} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-500">בטלפון, התפריט מוצג ככפתור ☰ באותו צד, וכפתור ״התקשרו״ מופיע רק שם.</p>
        {data.navLayout && (
          <button
            type="button"
            onClick={() => {
              update({ navLayout: "" });
              setAnnouncement("הסרגל חזר לסידור של העיצוב");
            }}
            className="min-h-10 rounded-lg px-3 text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            חזרה לסידור של העיצוב
          </button>
        )}
      </div>
      <p aria-live="polite" className="sr-only">{announcement}</p>
    </div>
  );
}
