"use client";

import { useEffect, useRef } from "react";
import type { SiteData } from "@/types/site";

/** Live preview: an iframe running the real WebsiteRenderer, fed the form data via postMessage. */
export function PreviewPane({ data }: { data: SiteData }) {
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
    <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border-8 border-gray-900 bg-white shadow-xl">
      <iframe ref={frame} src="/preview" title="תצוגה מקדימה של האתר" className="block h-[70vh] w-full lg:h-[calc(100vh-11rem)]" />
    </div>
  );
}
