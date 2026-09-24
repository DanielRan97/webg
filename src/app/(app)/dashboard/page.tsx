import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listWebsites } from "@/server/websites";
import { STATUS_INFO, SUBSCRIPTION_INFO } from "@/lib/status";
import { SiteCard } from "@/components/SiteCard";
import { VerificationBanner } from "@/components/VerificationBanner";

export const metadata: Metadata = { title: "האתרים שלי" };
export const dynamic = "force-dynamic";

function Legend() {
  return (
    <details className="rounded-2xl border border-gray-300 bg-white p-4">
      <summary className="min-h-11 cursor-pointer font-semibold">מה המשמעות של הסטטוסים?</summary>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {Object.values(STATUS_INFO).map((s) => (
          <div key={s.label}>
            <dt className="font-bold">{s.icon} {s.label}</dt>
            <dd className="text-gray-800">{s.meaning}</dd>
          </div>
        ))}
        {Object.values(SUBSCRIPTION_INFO).map((s) => (
          <div key={s.label}>
            <dt className="font-bold">{s.label}</dt>
            <dd className="text-gray-800">{s.meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const sites = await listWebsites(user.id);
  const { deleted } = await searchParams;
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {!user.emailVerifiedAt && <VerificationBanner />}
      {deleted && (
        <p role="status" className="flex gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-900">
          <span aria-hidden className="font-bold">✓</span>
          <span>האתר נמחק לצמיתות.</span>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">האתרים שלי</h1>
        <Link href="/create" className="inline-flex min-h-12 items-center rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700">
          + צור אתר חדש
        </Link>
      </div>
      {sites.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-400 bg-white p-10 text-center">
          <p className="text-xl font-bold">עדיין אין לכם אתר</p>
          <p className="mt-1 text-gray-700">ממלאים כמה פרטים על העסק, ותוך כמה דקות האתר מוכן.</p>
          <Link href="/create" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700">
            צור את האתר הראשון שלי
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((s) => <SiteCard key={s.id} site={s} />)}
          </div>
          <Legend />
        </>
      )}
    </main>
  );
}
