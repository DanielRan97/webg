"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, CloseIcon, MenuIcon } from "../shared/Icons";
import { useNavPortalRoot } from "./nav-portal";
import type { NavItem } from "./types";

const MORE_LABEL = "עוד";

/**
 * The site header's section-navigation, shared by all five templates so the
 * overflow behavior only needs solving once.
 *
 * Desktop (lg+): measures the real rendered width of every item (an
 * invisible duplicate row, same classes, so the measurement is exact for
 * whatever label text/length the owner actually has) and shows only as many
 * as fit on one line - `white-space: nowrap`, never wraps - with the rest
 * behind a "עוד" dropdown. The user's own section order is preserved
 * end-to-end; overflow only ever moves *later* items into "עוד", never
 * reorders anything.
 *
 * Mobile (<lg): a hamburger opens a drawer listing every enabled section
 * vertically - no 6-8 item cap there, since vertical space isn't scarce the
 * same way.
 */
export function SiteNav({
  nav,
  linkClassName,
  gapPx = 20,
  justify = "end",
}: {
  nav: NavItem[];
  /** Applied to every link - desktop primary items, "עוד" panel items, and the mobile drawer. Must not itself set display/wrapping. */
  linkClassName: string;
  gapPx?: number;
  justify?: "start" | "end" | "center";
}) {
  const portalRoot = useNavPortalRoot();
  const outerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const moreMeasureRef = useRef<HTMLDivElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const mobileBtnRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  // SSR-safe default before the client can measure real widths - refined
  // (usually before first paint, via useLayoutEffect) once mounted.
  const [visibleCount, setVisibleCount] = useState(() => Math.min(nav.length, 6));
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState<{ top: number; left: number } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const morePanelId = useId();
  const mobileMenuId = useId();

  useLayoutEffect(() => {
    function recompute() {
      const container = outerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;
      const available = container.clientWidth;
      if (available <= 0) return;
      const items = Array.from(measure.querySelectorAll<HTMLElement>("[data-nav-item]"));
      const moreWidth = moreMeasureRef.current?.offsetWidth ?? 0;
      let used = 0;
      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const w = items[i].offsetWidth;
        const withGap = used === 0 ? w : used + gapPx + w;
        const isLast = i === items.length - 1;
        const budget = isLast ? available : available - gapPx - moreWidth;
        if (withGap <= budget) {
          used = withGap;
          count = i + 1;
        } else {
          break;
        }
      }
      setVisibleCount(count);
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, [nav, gapPx]);

  // Position the "עוד" panel from the trigger's real coordinates (portal, so
  // it can never be clipped by the header), and keep it correctly placed
  // while the page scrolls - important since not every template's header is
  // sticky.
  useLayoutEffect(() => {
    if (!moreOpen) return;
    function place() {
      const trigger = moreBtnRef.current;
      const panel = morePanelRef.current;
      if (!trigger || !panel) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const width = panel.offsetWidth;
      const left = Math.min(Math.max(rect.left, 8), window.innerWidth - width - 8);
      setMorePos({ top: rect.bottom + gap, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [moreOpen]);

  // Both overlays are portaled to the end of the document (see nav-portal.tsx),
  // far from the trigger in DOM order - without this, Tab after opening one
  // would skip straight to unrelated content later on the page instead of
  // into the overlay. So while open, Tab/Shift+Tab are trapped to cycle only
  // through that overlay's own focusable elements.
  useEffect(() => {
    if (!moreOpen && !mobileOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (moreOpen && !rowRef.current?.contains(target) && !morePanelRef.current?.contains(target)) setMoreOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (moreOpen) {
          setMoreOpen(false);
          moreBtnRef.current?.focus();
        }
        if (mobileOpen) {
          setMobileOpen(false);
          mobileBtnRef.current?.focus();
        }
        return;
      }
      if (e.key !== "Tab") return;
      const trap: (HTMLElement | null)[] = moreOpen
        ? [moreBtnRef.current, ...Array.from(morePanelRef.current?.querySelectorAll<HTMLElement>("a") ?? [])]
        : Array.from(mobilePanelRef.current?.querySelectorAll<HTMLElement>("a, button") ?? []);
      if (trap.length === 0) return;
      const index = trap.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const next = e.shiftKey ? (index <= 0 ? trap.length - 1 : index - 1) : index >= trap.length - 1 ? 0 : index + 1;
      trap[next]?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen, mobileOpen]);

  // Move focus into whichever overlay just opened, matching the trap above.
  useEffect(() => {
    if (moreOpen) morePanelRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [moreOpen]);
  useEffect(() => {
    if (mobileOpen) mobilePanelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [mobileOpen]);

  if (nav.length === 0) return null;

  const primary = nav.slice(0, visibleCount);
  const overflow = nav.slice(visibleCount);
  const justifyClass = justify === "start" ? "justify-start" : justify === "center" ? "justify-center" : "justify-end";

  return (
    <>
      {/* Desktop: measured primary items + "עוד" for the rest. */}
      <div ref={outerRef} className={`relative hidden min-w-0 flex-1 lg:block`}>
        <div ref={rowRef} className={`flex items-center ${justifyClass}`} style={{ gap: gapPx }}>
          {primary.map((item) => (
            <a key={item.type} href={`#sec-${item.type}`} className={`whitespace-nowrap ${linkClassName}`}>
              {item.label}
            </a>
          ))}
          {overflow.length > 0 && (
            <button
              ref={moreBtnRef}
              type="button"
              aria-haspopup="true"
              aria-expanded={moreOpen}
              aria-controls={morePanelId}
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${linkClassName}`}
            >
              {MORE_LABEL}
              <ChevronDownIcon className={moreOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
          )}
        </div>

        {/* Invisible measuring copy: identical classes, so widths are exact for the real label text/length - kept out of the a11y tree and never interactive.
            `overflow-hidden` keeps the unwrapped full-width row from inflating the page's scrollable area when it doesn't fit - `offsetWidth` reads on
            each child below are unaffected by the ancestor's clipping. */}
        <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute inset-0 flex items-center overflow-hidden" style={{ gap: gapPx }}>
          {nav.map((item) => (
            <a key={item.type} data-nav-item href={`#sec-${item.type}`} tabIndex={-1} className={`whitespace-nowrap ${linkClassName}`}>
              {item.label}
            </a>
          ))}
          <div ref={moreMeasureRef} className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            {MORE_LABEL}
            <ChevronDownIcon />
          </div>
        </div>
      </div>

      {moreOpen &&
        portalRoot &&
        createPortal(
          <div
            ref={morePanelRef}
            id={morePanelId}
            dir="rtl"
            className="fixed z-50 min-w-40 max-w-72 rounded-2xl border border-t-line bg-t-surface p-2 text-t-fg shadow-lg"
            style={{ top: morePos?.top ?? 0, left: morePos?.left ?? 0, visibility: morePos ? "visible" : "hidden" }}
          >
            {overflow.map((item) => (
              <a
                key={item.type}
                href={`#sec-${item.type}`}
                onClick={() => setMoreOpen(false)}
                className={`block rounded-lg px-3 py-2 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${linkClassName}`}
              >
                {item.label}
              </a>
            ))}
          </div>,
          portalRoot,
        )}

      {/* Mobile: hamburger + full vertical list, no item-count cap. `ms-auto`
          keeps it pinned to the end of the header row even though the
          `flex-1` desktop nav above it is `hidden` (zero width) here, so it
          can no longer do that pushing job itself. */}
      <div className="ms-auto flex items-center lg:hidden">
        <button
          ref={mobileBtnRef}
          type="button"
          aria-label="פתיחת ניווט"
          aria-haspopup="true"
          aria-expanded={mobileOpen}
          aria-controls={mobileMenuId}
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <MenuIcon />
        </button>
      </div>

      {mobileOpen &&
        portalRoot &&
        createPortal(
          <div dir="rtl" className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div
              ref={mobilePanelRef}
              id={mobileMenuId}
              role="dialog"
              aria-modal="true"
              aria-label="ניווט"
              className="absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto rounded-b-2xl bg-t-surface p-4 shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-t-fg">ניווט</span>
                <button
                  type="button"
                  aria-label="סגירת ניווט"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-t-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <CloseIcon />
                </button>
              </div>
              <nav aria-label="ניווט" className="flex flex-col">
                {nav.map((item) => (
                  <a
                    key={item.type}
                    href={`#sec-${item.type}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-3 text-base text-t-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-t-tint"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>,
          portalRoot,
        )}
    </>
  );
}
