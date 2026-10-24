"use client";

import Link from "next/link";
import { useState } from "react";
import { PLAN, type Plan } from "@/lib/constants";
import { publicSiteHref } from "@/lib/site-url";
import { PublishButton, UpgradeToPro } from "./PlanChoice";
import { cx } from "./ui/ui";

/**
 * The owner's own bar over the preview of their site: what state it is in, and publishing right
 * from here, where they just checked it (the plan is chosen in the publish dialog). A live Basic site
 * also gets the way to Pro. On phones it sits above the site (the site keeps its own call/booking bar at
 * the bottom); from md up it floats at the bottom. Never part of the site itself.
 */
export function OwnerPreviewBar({
  id,
  slug,
  plan,
  templateId,
  state,
}: {
  id: string;
  slug: string;
  plan: string;
  templateId: string;
  state: "DRAFT" | "PUBLISHED" | "SUBSCRIPTION_INACTIVE";
}) {
  const [publishedOn, setPublishedOn] = useState<Plan | null>(null);
  const live = state === "PUBLISHED" || publishedOn !== null;
  const livePlan = publishedOn ?? plan;
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
            <Link href={publicSiteHref({ slug, plan: livePlan })} target="_blank" className={linkCls}>צפייה באתר החי</Link>
          ) : state === "DRAFT" ? (
            <PublishButton siteId={id} slug={slug} plan={plan} templateId={templateId} className="min-h-11 px-5 text-sm" onPublished={setPublishedOn} />
          ) : (
            <Link href="/dashboard" className={linkCls}>להפעלה מחדש</Link>
          )}
          <Link href={`/sites/${id}/edit`} className={linkCls}>עריכה</Link>
        </div>
      </div>
      {live && livePlan !== PLAN.PRO && (
        <div className="mt-2">
          <UpgradeToPro siteId={id} slug={slug} compact />
        </div>
      )}
      <p className="mt-1.5 text-xs text-ink-500">הסרגל של WEBG למעלה והפס הזה מופיעים רק לכם. באתר עצמו הלקוחות לא יראו אותם.</p>
      <div aria-live="polite">
        {publishedOn && <p className="mt-1.5 text-sm font-semibold text-emerald-700">האתר פורסם! מעכשיו הלקוחות יכולים לראות אותו.</p>}
      </div>
    </div>
  );
}
