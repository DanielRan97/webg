import type { Metadata } from "next";
import Link from "next/link";
import { WebgMark } from "@/components/WebgMark";

export const metadata: Metadata = { title: "הדף לא נמצא", robots: { index: false } };

/**
 * Every 404: an address that matches nothing, and every notFound() - a customer's site that doesn't
 * exist, or a site that belongs to someone else (which must look exactly the same). Visitors of
 * customers' sites land here too, so it stays neutral rather than selling WEBG.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 py-16 text-center text-ink-900">
      <Link href="/" aria-label="WEBG - דף הבית" className="mb-4">
        <WebgMark />
      </Link>
      <p aria-hidden className="text-6xl font-bold tracking-tight text-brand-600">404</p>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">הדף לא נמצא</h1>
      <p className="max-w-md text-ink-700">ייתכן שהכתובת הוקלדה עם טעות, או שהדף הוסר. בדקו את הכתובת ונסו שוב.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 font-semibold text-white transition hover:bg-brand-700">
          לדף הבית
        </Link>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-ink-200 bg-white px-5 font-semibold text-ink-900 transition hover:bg-ink-50">
          לאתרים שלי
        </Link>
      </div>
    </main>
  );
}
