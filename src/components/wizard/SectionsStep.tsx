"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getCategory } from "@/lib/categories";
import { SECTION_META, type SectionType } from "@/lib/sections";
import type { SectionData } from "@/types/site";
import { sectionHasContent } from "@/templates/shared/helpers";
import { Button, StepTitle, Toggle, cx } from "../ui/ui";
import type { StepProps } from "./steps";

const label = (id: string | number) => SECTION_META[id as SectionType]?.label ?? String(id);

/** Spoken by screen readers while dragging with the keyboard. */
const announcements: Announcements = {
  onDragStart: ({ active }) => `הרמתם את ״${label(active.id)}״. הזיזו עם החצים למעלה ולמטה, ולחצו על רווח כדי להניח.`,
  onDragOver: ({ active, over }) => (over ? `״${label(active.id)}״ נמצא מעל ״${label(over.id)}״.` : undefined),
  onDragEnd: ({ active }) => `״${label(active.id)}״ הונח במקום החדש.`,
  onDragCancel: ({ active }) => `הגרירה בוטלה. ״${label(active.id)}״ חזר למקומו.`,
};

function Row({
  s, index, count, hasContent, onToggle, onMove,
}: {
  s: SectionData;
  index: number;
  count: number;
  hasContent: boolean;
  onToggle: (v: boolean) => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: s.type });
  const meta = SECTION_META[s.type];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx("rounded-2xl border bg-white p-3 sm:p-4", isDragging ? "relative z-10 border-indigo-600 shadow-xl" : "border-gray-300")}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`גרירה לשינוי המיקום של ${meta.label}`}
          title="גררו כדי לשנות סדר"
          className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-xl text-gray-600 hover:bg-gray-100 active:cursor-grabbing"
        >
          <span aria-hidden>⋮⋮</span>
        </button>
        <div className="min-w-0 flex-1">
          <Toggle checked={s.enabled} onChange={onToggle} label={meta.label} onText="מוצג" offText="מוסתר" />
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" aria-label={`הזזת ${meta.label} למעלה`} disabled={index === 0} onClick={() => onMove(-1)} className="h-11 w-11 rounded-lg border border-gray-400 text-lg disabled:opacity-30">↑</button>
          <button type="button" aria-label={`הזזת ${meta.label} למטה`} disabled={index === count - 1} onClick={() => onMove(1)} className="h-11 w-11 rounded-lg border border-gray-400 text-lg disabled:opacity-30">↓</button>
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-700 sm:ps-12">{meta.hint}</p>
      {s.enabled && !hasContent && (
        <p className="mt-2 text-sm font-medium text-amber-800 sm:ps-12"><span aria-hidden>ℹ </span>עדיין אין כאן תוכן, ולכן החלק לא יוצג עד שתמלאו אותו.</p>
      )}
    </li>
  );
}

export function SectionsStep({ data, update }: StepProps) {
  const cat = getCategory(data.category);
  const [status, setStatus] = useState("");
  const hero = data.sections.find((s) => s.type === "hero");
  // Shown list: what fits this kind of business, plus anything already switched on.
  const shown = data.sections.filter((s) => s.type !== "hero" && (cat.sections.includes(s.type) || s.enabled));
  const more = data.sections.filter((s) => s.type !== "hero" && !cat.sections.includes(s.type) && !s.enabled);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function commit(nextShown: SectionData[], nextMore: SectionData[] = more) {
    update({ sections: [...(hero ? [hero] : []), ...nextShown, ...nextMore] });
  }
  function toggle(type: SectionType, enabled: boolean) {
    commit(shown.map((x) => (x.type === type ? { ...x, enabled } : x)));
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= shown.length) return;
    commit(arrayMove(shown, from, to));
    setStatus(`״${label(shown[from].type)}״ הועבר למקום ${to + 1} מתוך ${shown.length}.`);
  }
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = shown.findIndex((s) => s.type === e.active.id);
    const to = shown.findIndex((s) => s.type === e.over!.id);
    if (from >= 0 && to >= 0) commit(arrayMove(shown, from, to));
  }
  function add(type: SectionType) {
    commit([...shown, { type, enabled: true }], more.filter((s) => s.type !== type));
    setStatus(`״${label(type)}״ נוסף לאתר.`);
  }

  return (
    <div className="space-y-6">
      <StepTitle title="מה יופיע באתר?" subtitle="הדליקו את החלקים שרוצים. אפשר לגרור כדי לשנות סדר, או להשתמש בחצים. הסדר כאן הוא הסדר באתר, מלמעלה למטה." />

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-300 bg-gray-50 p-4">
        <span>
          <span className="block font-semibold">{SECTION_META.hero.label}</span>
          <span className="text-sm text-gray-700">{SECTION_META.hero.hint}</span>
        </span>
        <span className="shrink-0 rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold">תמיד מופיע</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable: "כדי לשנות את הסדר: לחצו על רווח, הזיזו עם החצים למעלה ולמטה, ולחצו שוב על רווח כדי להניח. Escape מבטל.",
          },
        }}
      >
        <SortableContext items={shown.map((s) => s.type)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {shown.map((s, i) => (
              <Row
                key={s.type}
                s={s}
                index={i}
                count={shown.length}
                hasContent={sectionHasContent(s.type, data)}
                onToggle={(v) => toggle(s.type, v)}
                onMove={(dir) => move(i, i + dir)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <p className="sr-only" role="status" aria-live="polite">{status}</p>

      {more.length > 0 && (
        <details className="rounded-2xl border border-gray-300 bg-white p-4">
          <summary className="min-h-11 cursor-pointer font-semibold">עוד חלקים שאפשר להוסיף ({more.length})</summary>
          <ul className="mt-3 space-y-3">
            {more.map((s) => (
              <li key={s.type} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                <span>
                  <span className="block font-semibold">{SECTION_META[s.type].label}</span>
                  <span className="text-sm text-gray-700">{SECTION_META[s.type].hint}</span>
                </span>
                <Button type="button" variant="secondary" className="min-h-11 shrink-0 px-4" onClick={() => add(s.type)} aria-label={`הוספת ${SECTION_META[s.type].label} לאתר`}>
                  + הוספה
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
