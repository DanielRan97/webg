import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteAdminDetail } from "@/server/admin";
import { basicUrlDisplay, publicSiteHref, publicSiteUrlDisplay } from "@/lib/site-url";
import { PlanOverride } from "@/components/admin/PlanOverride";

export const metadata: Metadata = { title: "פרטי אתר - WEBG Admin" };
export const dynamic = "force-dynamic";

const linkClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="font-semibold text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

export default async function AdminSiteDetailPage({ params }: PageProps<"/admin/sites/[id]">) {
  const { id } = await params;
  const site = await getSiteAdminDetail(id);
  if (!site) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/sites" className="text-sm font-semibold text-indigo-700 underline">← כל האתרים</Link>
        <h1 className="mt-1 text-2xl font-extrabold">{site.businessName}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={publicSiteHref(site)} target="_blank" className={linkClass}>פתיחת האתר</Link>
        <Link href={`/sites/${site.id}/edit`} target="_blank" className={linkClass}>עריכת האתר</Link>
        <Link href={`/sites/${site.id}/admin`} target="_blank" className={linkClass}>מרכז הפניות</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-300 bg-white p-4">
          <Row label="בעלים" value={<span dir="ltr">{site.ownerEmail}</span>} />
          <Row label="תוכנית" value={site.plan} />
          <Row label="סטטוס" value={site.status === "PUBLISHED" ? "מפורסם" : "טיוטה"} />
          <Row label="כתובת ראשית" value={<span dir="ltr">{publicSiteUrlDisplay(site)}</span>} />
          {site.plan === "PRO" && (
            <Row label="כתובת קודמת (Basic)" value={<span dir="ltr">{basicUrlDisplay(site.slug)}</span>} />
          )}
          <Row label="נוצר" value={site.createdAt.toLocaleString("he-IL")} />
          <Row label="עודכן" value={site.updatedAt.toLocaleString("he-IL")} />
          <Row label="כניסות" value={site.visits} />
          <Row label="פניות" value={site.interactionCount} />
          {site.subscription && <Row label="סטטוס מנוי" value={site.subscription.status} />}
        </section>

        <section className="rounded-2xl border border-gray-300 bg-white p-4">
          <PlanOverride siteId={site.id} plan={site.plan} />
        </section>
      </div>
    </div>
  );
}
