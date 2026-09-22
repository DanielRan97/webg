"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { publishSiteAction } from "@/server/actions/sites";
import { CopyButton } from "../CopyButton";
import { Button, Notice } from "../ui/ui";

/** Shown right after the wizard creates the website. */
export function CreatedScreen({ id, slug, businessName }: { id: string; slug: string; businessName: string }) {
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const address = `webg.co.il/s/${slug}`;

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
      <div aria-hidden className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-800">✓</div>
      <h1 id="step-title" tabIndex={-1} className="text-3xl font-extrabold outline-none">האתר שלך מוכן</h1>
      <p className="mt-2 text-lg text-gray-700">יצרנו את האתר של ״{businessName}״. עוד רגע הלקוחות יוכלו לראות אותו.</p>

      <div className="mt-8 space-y-3 rounded-3xl border border-gray-300 bg-white p-5 text-start">
        <p className="text-sm font-semibold text-gray-900">זו הכתובת שבה הלקוחות שלך יוכלו לראות את האתר:</p>
        <p className="break-all text-lg font-bold text-indigo-800" dir="ltr">{address}</p>
        <CopyButton text={address} />
      </div>

      {published ? (
        <div className="mt-6 space-y-3">
          <Notice kind="success">האתר פורסם! מעכשיו הלקוחות יכולים לראות אותו.</Notice>
          <Link href={`/s/${slug}`} target="_blank" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700">
            צפייה באתר החי
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-gray-700">רק אחרי הפרסום הלקוחות יוכלו לראות את האתר.</p>
          {error && <Notice kind="error">{error}</Notice>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/sites/${id}/preview`} target="_blank" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-400 bg-white px-6 font-semibold hover:bg-gray-50">
              תצוגה מקדימה
            </Link>
            <Link href={`/sites/${id}/edit`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-400 bg-white px-6 font-semibold hover:bg-gray-50">
              עריכת האתר
            </Link>
            <Button loading={pending} onClick={publish}>{pending ? "מפרסם..." : "פרסום האתר"}</Button>
          </div>
        </div>
      )}

      <p className="mt-10">
        <Link href="/dashboard" className="font-semibold text-indigo-800 underline">לכל האתרים שלי</Link>
      </p>
    </main>
  );
}
