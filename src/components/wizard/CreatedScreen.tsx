"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { publishSiteAction } from "@/server/actions/sites";
import { publicSiteHref, publicSiteUrlDisplay } from "@/lib/site-url";
import { needsProToPublish } from "@/lib/plan";
import { ProTemplateNotice } from "../ProTemplateNotice";
import { CopyButton } from "../CopyButton";
import { Button, Notice } from "../ui/ui";

/** Shown right after the wizard creates the website. */
export function CreatedScreen({ id, slug, plan, businessName, templateId }: { id: string; slug: string; plan: string; businessName: string; templateId: string }) {
  const [published, setPublished] = useState(false);
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
      <h1 id="step-title" tabIndex={-1} className="text-3xl font-bold tracking-tight md:text-4xl outline-none">האתר שלך מוכן</h1>
      <p className="mt-2 text-lg text-ink-700">יצרנו את האתר של ״{businessName}״. עוד רגע הלקוחות יוכלו לראות אותו.</p>

      <div className="mt-8 space-y-3 rounded-xl border border-ink-200 shadow-sm bg-white p-5 text-start">
        <p className="text-sm font-semibold text-ink-900">זו הכתובת שבה הלקוחות שלך יוכלו לראות את האתר:</p>
        <p className="break-all text-xl font-bold text-ink-900" dir="ltr"><span className="text-brand-700">{address}</span></p>
        <CopyButton text={address} />
      </div>

      {published ? (
        <div className="mt-6 space-y-3">
          <Notice kind="success">האתר פורסם! מעכשיו הלקוחות יכולים לראות אותו.</Notice>
          <Link href={publicSiteHref({ slug, plan })} target="_blank" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">
            צפייה באתר החי
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-ink-700">רק אחרי הפרסום הלקוחות יוכלו לראות את האתר.</p>
          {needsPro && <ProTemplateNotice siteId={id} />}
          {error && <Notice kind="error">{error}</Notice>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/sites/${id}/preview`} target="_blank" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink-200 shadow-sm bg-white px-6 font-semibold text-ink-800 hover:bg-ink-50">
              תצוגה מקדימה
            </Link>
            <Link href={`/sites/${id}/edit`} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink-200 shadow-sm bg-white px-6 font-semibold text-ink-800 hover:bg-ink-50">
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
