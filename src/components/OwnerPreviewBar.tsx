"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishSiteAction } from "@/server/actions/sites";
import { publicSiteHref } from "@/lib/site-url";
import { Button, cx } from "./ui/ui";

/**
 * The owner's own bar over the preview of their site: what state it is in, and publishing right
 * from here, where they just checked it. On phones it sits above the site (the site keeps its own
 * call/booking bar at the bottom); from md up it floats at the bottom. Never part of the site itself.
 */
export function OwnerPreviewBar({
  id,
  slug,
  plan,
  state,
  needsPro,
}: {
  id: string;
  slug: string;
  plan: string;
  state: "DRAFT" | "PUBLISHED" | "SUBSCRIPTION_INACTIVE";
  needsPro: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [justPublished, setJustPublished] = useState(false);

  function publish() {
    setError("");
    start(async () => {
      try {
        const res = await publishSiteAction(id);
        if (res.ok) {
          setJustPublished(true);
          router.refresh();
        } else setError(res.error ?? "לא הצלחנו לפרסם. נסו שוב.");
      } catch {
        setError("לא הצלחנו לפרסם. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    });
  }

  const live = state === "PUBLISHED" || justPublished;
  const linkCls = "inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-ink-50";

  return (
    <div className="z-40 border-b border-ink-200 bg-white px-4 py-3 md:fixed md:inset-x-0 md:bottom-4 md:mx-auto md:w-fit md:max-w-[calc(100%-2rem)] md:rounded-2xl md:border md:shadow-[0_20px_50px_-20px_rgb(15_27_48/0.45)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink-900">
          <span aria-hidden className={cx("h-2 w-2 shrink-0 rounded-full", live ? "webg-live-dot bg-emerald-500" : state === "SUBSCRIPTION_INACTIVE" ? "bg-red-500" : "bg-ink-400")} />
          {live ? "האתר באוויר" : state === "SUBSCRIPTION_INACTIVE" ? "המנוי לא פעיל, האתר לא מוצג ללקוחות" : "טיוטה: רק אתם רואים את האתר"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {live ? (
            <Link href={publicSiteHref({ slug, plan })} target="_blank" className={linkCls}>צפייה באתר החי</Link>
          ) : state === "DRAFT" && !needsPro ? (
            <Button type="button" className="min-h-11 px-5 text-sm" loading={pending} onClick={publish}>
              {pending ? "מפרסם..." : "פרסום האתר"}
            </Button>
          ) : state === "DRAFT" ? (
            <Link href={`/sites/${id}/edit?tab=branding`} className={linkCls}>האתר בעיצוב Pro: בחירת עיצוב רגיל</Link>
          ) : (
            <Link href="/dashboard" className={linkCls}>להפעלה מחדש</Link>
          )}
          <Link href={`/sites/${id}/edit`} className={linkCls}>עריכה</Link>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-ink-500">הסרגל של WEBG למעלה והפס הזה מופיעים רק לכם. באתר עצמו הלקוחות לא יראו אותם.</p>
      <div aria-live="polite">
        {justPublished && <p className="mt-1.5 text-sm font-semibold text-emerald-700">האתר פורסם! מעכשיו הלקוחות יכולים לראות אותו.</p>}
        {error && <p role="alert" className="mt-1.5 text-sm font-semibold text-red-700">{error}</p>}
      </div>
    </div>
  );
}
