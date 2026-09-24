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
import { ChevronDownIcon, GripIcon, WarningIcon } from "../ui/icons";
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
  const muted = !s.enabled;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "rounded-2xl border p-3 transition",
        isDragging ? "relative z-10 border-indigo-600 bg-white shadow-xl" : muted ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white",
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`גרירה לשינוי המיקום של ${meta.label}`}
          title="גררו כדי לשנות סדר"
          className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
        >
          <GripIcon />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <p className={cx("text-base font-bold", muted ? "text-gray-700" : "text-gray-900")}>{meta.label}</p>
          <p className={cx("text-sm", muted ? "text-gray-500" : "text-gray-600")}>{meta.hint}</p>
          <Toggle checked={s.enabled} onChange={onToggle} label={meta.label} labelClassName="sr-only" onText="מוצג" offText="מוסתר" />
          {s.enabled && !hasContent && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <WarningIcon className="shrink-0" width="14" height="14" />
              עדיין אין כאן תוכן, ולכן החלק לא יוצג עד שתמלאו אותו.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            aria-label={`הזזת ${meta.label} למעלה`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <span aria-hidden>↑</span>
          </button>
          <button
            type="button"
            aria-label={`הזזת ${meta.label} למטה`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <span aria-hidden>↓</span>
          </button>
        </div>
      </div>
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
      <StepTitle title="מה יופיע באתר?" subtitle="הדליקו את החלקים שרוצים. הסדר כאן הוא הסדר באתר, מלמעלה למטה." />

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
        <span>
          <span className="block text-base font-bold text-gray-900">{SECTION_META.hero.label}</span>
          <span className="text-sm text-gray-600">{SECTION_META.hero.hint}</span>
        </span>
        <span className="shrink-0 rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-800">תמיד מופיע</span>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">החלקים באתר</p>
        <p className="text-sm text-gray-600">גררו חלקים כדי לשנות את הסדר, או השתמשו בחצים.</p>

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
            <ul className="space-y-2">
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
      </div>

      <p className="sr-only" role="status" aria-live="polite">{status}</p>

      {more.length > 0 && (
        <details className="group rounded-2xl border border-gray-200 bg-white p-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
            עוד חלקים שאפשר להוסיף ({more.length})
            <ChevronDownIcon className="text-gray-500 transition group-open:rotate-180" />
          </summary>
          <ul className="mt-2 divide-y divide-gray-100">
            {more.map((s) => (
              <li key={s.type} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-semibold text-gray-900">{SECTION_META[s.type].label}</span>
                  <span className="text-sm text-gray-600">{SECTION_META[s.type].hint}</span>
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
