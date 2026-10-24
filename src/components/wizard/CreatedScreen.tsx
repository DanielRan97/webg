"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { publishSiteAction } from "@/server/actions/sites";
import { publicSiteHref, publicSiteUrlDisplay } from "@/lib/site-url";
import { needsProToPublish } from "@/lib/plan";
import { ProTemplateNotice } from "../ProTemplateNotice";
import { CopyButton } from "../CopyButton";
import { Button, Notice } from "../ui/ui";
import { LockIcon } from "../icons";

/** Shown right after the wizard creates the website. */
export function CreatedScreen({ id, slug, plan, businessName, templateId, alreadyPublished = false }: { id: string; slug: string; plan: string; businessName: string; templateId: string; alreadyPublished?: boolean }) {
  const [published, setPublished] = useState(alreadyPublished);
  const needsPro = needsProToPublish({ plan, templateId });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const address = publicSiteUrlDisplay({ slug, plan });

  function publish() {
    setError("");
    start(async () => {
      try {
        const res = await publishSiteAction(id);
        if (res.ok) setPublished(true);
        else setError(res.error ?? "לא הצלחנו לפרסם. נסו שוב.");
      } catch {
        setError("לא הצלחנו לפרסם. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    });
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center">
      {/* The one celebratory moment: a check that pops in, ringed by the brand gradient. */}
      <div aria-hidden className="webg-pop mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-linear-to-br from-brand-600 to-cyan-400 text-2xl font-bold text-white shadow-[0_14px_34px_-12px_rgb(21_70_209/0.7)]">
        ✓
      </div>
      <h1 id="step-title" tabIndex={-1} className="text-3xl font-bold tracking-tight md:text-4xl outline-none">האתר שלך מוכן</h1>
      <p className="mt-2 text-lg text-ink-700">יצרנו את האתר של ״{businessName}״. עוד רגע הלקוחות יוכלו לראות אותו.</p>

      <div className="webg-rise mt-8 space-y-3 rounded-2xl border border-ink-200 bg-white p-5 text-start shadow-[0_24px_60px_-40px_rgb(15_27_48/0.35)]">
        <p className="text-sm font-semibold text-ink-900">זו הכתובת שבה הלקוחות שלך יוכלו לראות את האתר:</p>
        <p dir="ltr" className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-lg font-bold text-brand-700">
          <LockIcon className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="break-all">{address}</span>
          {published && <span className="ms-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span aria-hidden className="webg-live-dot h-2 w-2 rounded-full bg-emerald-500" />באוויר</span>}
        </p>
        <CopyButton text={address} />
      </div>

      {published ? (
        <div className="mt-6 space-y-3">
          <Notice kind="success">האתר פורסם! מעכשיו הלקוחות יכולים לראות אותו.</Notice>
          <Link href={publicSiteHref({ slug, plan })} target="_blank" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-600 px-6 font-semibold text-white transition hover:bg-brand-700 hover:shadow-[0_8px_20px_-8px_rgb(21_70_209/0.55)] active:scale-[0.98]">
            צפייה באתר החי
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-ink-700">רק אחרי הפרסום הלקוחות יוכלו לראות את האתר.</p>
          {needsPro && <ProTemplateNotice siteId={id} />}
          {error && <Notice kind="error">{error}</Notice>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/sites/${id}/preview`} target="_blank" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink-200 bg-white px-6 font-semibold text-ink-800 shadow-sm transition hover:border-ink-300 hover:bg-ink-50 active:scale-[0.98]">
              תצוגה מקדימה
            </Link>
            <Link href={`/sites/${id}/edit`} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink-200 bg-white px-6 font-semibold text-ink-800 shadow-sm transition hover:border-ink-300 hover:bg-ink-50 active:scale-[0.98]">
              עריכת האתר
            </Link>
            {!needsPro && <Button loading={pending} onClick={publish}>{pending ? "מפרסם..." : "פרסום האתר"}</Button>}
          </div>
        </div>
      )}

      <p className="mt-10">
        <Link href="/dashboard" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">לכל האתרים שלי</Link>
      </p>
    </main>
  );
}
