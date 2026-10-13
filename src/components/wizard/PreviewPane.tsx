"use client";

import { useEffect, useRef } from "react";
import type { SiteData } from "@/types/site";
import { LockIcon } from "../icons";

/** Live preview: an iframe running the real WebsiteRenderer, fed the form data via postMessage. `address` adds a browser-style address bar above it. */
export function PreviewPane({
  data,
  frameClassName = "h-[70vh] lg:h-[calc(100vh-11rem)]",
  address,
}: {
  data: SiteData;
  frameClassName?: string;
  address?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(data);

  useEffect(() => {
    latest.current = data;
    frame.current?.contentWindow?.postMessage({ type: "webg:preview", data }, window.location.origin);
  }, [data]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "webg:preview-ready") return;
      frame.current?.contentWindow?.postMessage({ type: "webg:preview", data: latest.current }, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border-8 border-ink-900 bg-white shadow-2xl shadow-ink-950/20">
      {address && (
        <div dir="ltr" className="flex items-center justify-center gap-1.5 border-b border-ink-100 bg-ink-50 px-4 py-2 text-xs text-ink-600">
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="truncate font-medium">{address}</span>
        </div>
      )}
      <iframe ref={frame} src="/preview" title="תצוגה מקדימה של האתר" className={`block w-full ${frameClassName}`} />
    </div>
  );
}
