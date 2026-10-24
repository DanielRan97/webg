"use client";

import { useEffect, useRef } from "react";
import type { SiteData } from "@/types/site";
import { ExternalLinkIcon } from "../ui/icons";
import { LockIcon } from "../icons";
import { PREVIEW_SCROLL_EVENT } from "./preview-scroll";

/**
 * Live preview: an iframe running the real WebsiteRenderer, fed the form data via postMessage. `address`
 * adds a browser-style address bar above it. "פתיחה בחלון חדש" opens the same preview in its own window,
 * at that window's real size (phone, tablet or wide screen), and keeps it updated while the owner edits.
 */
export function PreviewPane({
  data,
  frameClassName = "h-[70vh] lg:h-[calc(100vh-11rem)]",
  address,
  newWindow = false,
}: {
  data: SiteData;
  frameClassName?: string;
  address?: string;
  /** Show the "פתיחה בחלון חדש" button (the editor; not the home page demo). */
  newWindow?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(data);
  const popup = useRef<Window | null>(null);

  useEffect(() => {
    latest.current = data;
    const msg = { type: "webg:preview", data };
    frame.current?.contentWindow?.postMessage(msg, window.location.origin);
    if (popup.current && !popup.current.closed) popup.current.postMessage(msg, window.location.origin);
  }, [data]);

  useEffect(() => {
    // Either preview (the iframe or the separate window) says it's ready: send it the current data.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "webg:preview-ready") return;
      (e.source as Window | null)?.postMessage({ type: "webg:preview", data: latest.current }, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // "Show this section": wait a frame or two, so a preview that was just switched into view has its layout.
  useEffect(() => {
    const onShow = (e: Event) => {
      const section = (e as CustomEvent<string>).detail;
      setTimeout(() => frame.current?.contentWindow?.postMessage({ type: "webg:preview-scroll", section }, window.location.origin), 80);
    };
    window.addEventListener(PREVIEW_SCROLL_EVENT, onShow);
    return () => window.removeEventListener(PREVIEW_SCROLL_EVENT, onShow);
  }, []);

  function openWindow() {
    if (popup.current && !popup.current.closed) {
      popup.current.focus();
      return;
    }
    popup.current = window.open("/preview", "webg-preview");
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border-8 border-ink-900 bg-white shadow-2xl shadow-ink-950/20">
        {address && (
          <div dir="ltr" className="flex items-center justify-center gap-1.5 border-b border-ink-100 bg-ink-50 px-4 py-2 text-xs text-ink-600">
            <LockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate font-medium">{address}</span>
          </div>
        )}
        <iframe ref={frame} src="/preview" title="תצוגה מקדימה של האתר" className={`block w-full ${frameClassName}`} />
      </div>
      {newWindow && (
        <div className="mx-auto mt-3 max-w-[390px] text-center">
          <button
            type="button"
            onClick={openWindow}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-900 shadow-sm transition hover:bg-ink-50"
          >
            <ExternalLinkIcon aria-hidden />
            פתיחה בחלון חדש
          </button>
          <p className="mt-1 text-xs text-ink-500">בגודל מלא, כמו במחשב או בטאבלט. מתעדכן תוך כדי עריכה.</p>
        </div>
      )}
    </>
  );
}
