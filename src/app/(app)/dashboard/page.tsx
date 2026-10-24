import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listWebsites } from "@/server/websites";
import { getUnreadCounts } from "@/server/interactions";
import { STATUS_INFO, SUBSCRIPTION_INFO } from "@/lib/status";
import { inquiryCenterOn, isPro } from "@/lib/plan";
import { isPubliclyVisible } from "@/lib/subscription";
import { SiteCard } from "@/components/SiteCard";
import { VerificationBanner } from "@/components/VerificationBanner";

export const metadata: Metadata = { title: "האתרים שלי" };
export const dynamic = "force-dynamic";

const ctaClass =
  "inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-[0_8px_20px_-8px_rgb(21_70_209/0.55)] active:scale-[0.98]";

function Legend() {
  return (
    <details className="rounded-2xl border border-ink-200 bg-white p-5">
      <summary className="min-h-11 cursor-pointer font-semibold">מה המשמעות של הסטטוסים?</summary>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {Object.values(STATUS_INFO).map((s) => (
          <div key={s.label}>
            <dt className="font-bold">{s.icon} {s.label}</dt>
            <dd className="text-ink-800">{s.meaning}</dd>
          </div>
        ))}
        {Object.values(SUBSCRIPTION_INFO).map((s) => (
          <div key={s.label}>
            <dt className="font-bold">{s.label}</dt>
            <dd className="text-ink-800">{s.meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** The first-visit state: an invitation with a tiny site being sketched (the home page backdrop's idea), not an apology. */
function EmptyState() {
  return (
    <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-ink-200 bg-white p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:p-10">
      <div>
        <p className="text-2xl font-bold tracking-tight">האתר הראשון שלכם מחכה</p>
        <p className="mt-2 max-w-md leading-relaxed text-ink-600">
          ממלאים כמה פרטים על העסק, רואים את האתר נבנה תוך כדי, ומפרסמים כשמוכנים. אפשר לשנות הכול גם אחר כך.
        </p>
        <Link href="/create" className={`mt-6 ${ctaClass}`}>יצירת האתר הראשון שלי</Link>
      </div>
      <div aria-hidden className="mx-auto w-full max-w-72 space-y-2 rounded-xl border border-ink-200 bg-ink-50 p-3">
        <div dir="ltr" className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-[10px] text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          webg.co.il/s/your-business
        </div>
        <div className="h-16 rounded-md bg-linear-to-l from-brand-600 to-cyan-400 opacity-80" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-10 rounded-md border border-dashed border-ink-300 bg-white" />
          <div className="h-10 rounded-md border border-dashed border-ink-300 bg-white" />
          <div className="h-10 rounded-md border border-dashed border-ink-300 bg-white" />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const [sites, unreadCounts] = await Promise.all([listWebsites(user.id), getUnreadCounts(user.id)]);
  const { deleted } = await searchParams;
  const liveCount = sites.filter(isPubliclyVisible).length;
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {!user.emailVerifiedAt && <VerificationBanner />}
      {deleted && (
        <p role="status" className="flex gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-900">
          <span aria-hidden className="font-bold">✓</span>
          <span>האתר נמחק לצמיתות.</span>
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">האתרים שלי</h1>
          {sites.length > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-600">
              {liveCount > 0 && <span aria-hidden className="webg-live-dot h-2 w-2 rounded-full bg-emerald-500" />}
              {sites.length === 1 ? "אתר אחד" : `${sites.length} אתרים`}
              {" · "}
              {liveCount === 0 ? "עוד לא באוויר" : liveCount === 1 ? "אחד באוויר" : `${liveCount} באוויר`}
            </p>
          )}
        </div>
        <Link href="/create" className={ctaClass}>
          <span aria-hidden className="text-lg leading-none">+</span>
          אתר חדש
        </Link>
      </div>
      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* A Basic site's real unread count is never sent down at all - not just hidden client-side. */}
            {sites.map((s) => <SiteCard key={s.id} site={s} unreadCount={inquiryCenterOn(s) ? (unreadCounts[s.id] ?? 0) : 0} />)}
          </div>
          <Legend />
        </>
      )}
    </main>
  );
}
