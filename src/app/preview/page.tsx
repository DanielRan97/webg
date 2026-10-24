"use client";

import { useEffect, useState } from "react";
import type { SiteData } from "@/types/site";
import { emptySiteData, withPreviewPlaceholders } from "@/lib/site-defaults";
import { WebsiteRenderer } from "@/templates/WebsiteRenderer";

/**
 * Rendered inside an iframe by the wizard/editor. The parent posts the current
 * form data; we render it with the same WebsiteRenderer the public page uses.
 * Living in an iframe gives the preview a real viewport, so mobile layouts are true to life.
 */
export default function PreviewFrame() {
  const [data, setData] = useState<SiteData>(() => emptySiteData());

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "webg:preview") setData(e.data.data as SiteData);
      if (e.data?.type === "webg:preview-scroll" && typeof e.data.section === "string") {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // Scroll only this frame (scrollIntoView would also scroll the wizard page around it).
        const el = document.getElementById(`sec-${e.data.section}`);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
          window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
        }
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "webg:preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <WebsiteRenderer template={data.templateId} data={withPreviewPlaceholders(data)} />;
}
