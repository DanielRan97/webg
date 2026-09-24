"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sectionHasContent } from "@/templates/shared/helpers";
import { withPreviewPlaceholders } from "@/lib/site-defaults";
import { TEMPLATES, getTemplate } from "@/templates/registry";
import type { SiteData } from "@/types/site";
import { cx } from "../ui/ui";

const RENDER_WIDTH = 1000;

/** A small, non-interactive picture of the real template, scaled down. Uses the site's own colors and content. */
function Thumbnail({ templateId, data }: { templateId: string; data: SiteData }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / RENDER_WIDTH);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Only the header, hero and the first two sections that have content (no map, to keep it light).
  const preview = useMemo(() => {
    const full = withPreviewPlaceholders(data);
    const body = full.sections
      .filter((s) => s.type !== "hero" && s.type !== "location" && s.enabled && sectionHasContent(s.type, full))
      .slice(0, 2);
    return { ...full, sections: [{ type: "hero" as const, enabled: true }, ...body] };
  }, [data]);

  const { Component } = getTemplate(templateId);
  return (
    <div ref={box} aria-hidden className="pointer-events-none relative aspect-[5/4] w-full select-none overflow-hidden rounded-lg border border-gray-300 bg-white">
      <div className="absolute right-0 top-0 origin-top-right" style={{ width: RENDER_WIDTH, transform: `scale(${scale})` }} {...{ inert: true }}>
        <Component data={preview} />
      </div>
    </div>
  );
}

export function TemplatePicker({ data, onPick }: { data: SiteData; onPick: (id: string) => void }) {
  return (
    <div role="group" aria-labelledby="tpl-label" className="space-y-2">
      <p id="tpl-label" className="text-sm font-semibold text-gray-900">סגנון עיצוב</p>
      <p className="text-sm text-gray-600">בחרו איך האתר ייראה. אפשר להחליף בכל רגע.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const selected = data.templateId === t.id;
          return (
            <div
              key={t.id}
              className={cx(
                "relative flex h-full flex-col gap-2 rounded-2xl border-2 p-2 text-center transition",
                selected ? "border-indigo-700 bg-indigo-50 ring-2 ring-indigo-200" : "border-gray-300 bg-white hover:border-gray-400",
              )}
            >
              <div className="relative">
                <Thumbnail templateId={t.id} data={data} />
                {selected && (
                  <span aria-hidden className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-sm text-white shadow">✓</span>
                )}
              </div>
              <span className="font-semibold">{t.label}</span>
              <span className="text-xs text-gray-700">{t.description}</span>
              {/* The whole card is one button, kept separate from the preview so no links sit inside it. */}
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${t.label}: ${t.description}`}
                onClick={() => onPick(t.id)}
                className="absolute inset-0 rounded-2xl"
              />
            </div>
          );
        })}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <span aria-hidden>ℹ</span>
        החלפת סגנון לא מוחקת מידע — כל פרטי העסק נשארים.
      </p>
    </div>
  );
}
