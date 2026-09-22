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
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "webg:preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <WebsiteRenderer template={data.templateId} data={withPreviewPlaceholders(data)} />;
}
