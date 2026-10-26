import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { SentryClientTest } from "./SentryClientTest";

/**
 * TEMPORARY - checks that errors reach Sentry, then gets deleted. Admins only (checked here as well as in
 * the admin layout, since a layout and its page render in parallel). Nothing links here.
 */
export default async function SentryTestPage({ searchParams }: PageProps<"/admin/sentry-test">) {
  await requireAdmin();
  if ((await searchParams).throw === "server") {
    throw new Error("WEBG Sentry test: server error (admin test page)");
  }
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-bold">בדיקת Sentry</h1>
      <p className="text-ink-700">כל כפתור שולח שגיאת בדיקה אחת. אחרי כמה שניות היא אמורה להופיע ב־Sentry, בעמוד Issues.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/sentry-test?throw=server" prefetch={false} className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
          שגיאה בשרת
        </Link>
        <SentryClientTest />
      </div>
    </main>
  );
}
