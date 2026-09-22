import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { listWebsites, type WebsiteRecord } from "@/server/websites";
import { displayState, isPubliclyVisible } from "@/lib/subscription";
import { STATUS_INFO, SUBSCRIPTION_INFO, nextStep, subscriptionInfo } from "@/lib/status";
import { getCategory } from "@/lib/categories";
import { Logo } from "@/templates/shared/Logo";
import { SiteActions } from "@/components/SiteActions";
import { CopyButton } from "@/components/CopyButton";

export const metadata: Metadata = { title: "האתרים שלי" };
export const dynamic = "force-dynamic";

const linkBtn = "inline-flex min-h-11 items-center rounded-xl border border-gray-400 px-4 text-sm font-semibold hover:bg-gray-50";

function SiteCard({ site }: { site: WebsiteRecord }) {
  const d = site.data;
  const state = displayState(site);
  const info = STATUS_INFO[state];
  const online = isPubliclyVisible(site);
  const address = `webg.co.il/s/${site.slug}`;
  return (
    <article aria-labelledby={`t-${site.id}`} className="overflow-hidden rounded-3xl border border-gray-300 bg-white shadow-sm">
      <div
        className="relative flex h-32 items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${d.primaryColor}, color-mix(in srgb, ${d.primaryColor} 60%, #000))` }}
      >
        {d.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.heroImageUrl} alt="" className={`absolute inset-0 h-full w-full object-cover ${online ? "" : "grayscale"}`} />
        )}
        <div className="relative rounded-2xl bg-white/90 p-2 shadow">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color={d.primaryColor} size={52} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h2 id={`t-${site.id}`} className="text-xl font-bold">{d.businessName}</h2>
          <p className="text-sm text-gray-700">{getCategory(d.category).label}</p>
        </div>

        {/* 1. Is it online? */}
        <div className={`rounded-2xl border-2 p-3 ${online ? "border-green-600 bg-green-50" : "border-gray-300 bg-gray-50"}`}>
          <p className="flex flex-wrap items-center gap-2 font-bold">
            <span aria-hidden>{online ? "●" : "○"}</span>
            {online ? "האתר אונליין" : "האתר לא אונליין"}
            <span className={`rounded-full border px-2.5 py-0.5 text-sm font-semibold ${info.cls}`}>
              <span aria-hidden>{info.icon} </span>{info.label}
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-800">{info.meaning}</p>
        </div>

        {/* 2. Public address */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">כתובת האתר</p>
          <p className="break-all font-bold text-indigo-800" dir="ltr">{address}</p>
          {!online && <p className="text-sm text-gray-700">הלקוחות יוכלו להיכנס לכתובת הזו רק כשהאתר אונליין.</p>}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={address} />
            {online && <Link href={`/s/${site.slug}`} target="_blank" className={linkBtn}>פתיחת האתר</Link>}
          </div>
        </div>

        {/* 3. What next? */}
        <p className="rounded-xl bg-indigo-50 p-3 text-sm font-medium text-indigo-950">
          <span className="font-bold">מה עכשיו? </span>{nextStep(site)}
        </p>

        <div className="flex flex-wrap gap-2">
          <Link href={`/sites/${site.id}/edit`} className={linkBtn}>עריכת האתר</Link>
          <Link href={`/sites/${site.id}/preview`} target="_blank" className={linkBtn}>תצוגה מקדימה</Link>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <SiteActions id={site.id} slug={site.slug} status={site.status} subscriptionStatus={site.subscriptionStatus} />
          <p className="mt-3 text-sm text-gray-700">
            <span className="font-semibold">{subscriptionInfo(site.subscriptionStatus).label}:</span>{" "}
            {subscriptionInfo(site.subscriptionStatus).meaning}
          </p>
        </div>
      </div>
    </article>
  );
}

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

export default async function DashboardPage() {
  const user = await requireUser();
  const sites = await listWebsites(user.id);
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
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
