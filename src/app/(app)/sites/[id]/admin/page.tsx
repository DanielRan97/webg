import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedWebsite } from "@/server/websites";
import { listInteractions } from "@/server/interactions";
import { canAccessInbox } from "@/lib/plan";
import { AdminInbox } from "@/components/AdminInbox";
import { LockedFeature } from "@/components/LockedFeature";
import { PlanComparison } from "@/components/PlanComparison";

export const metadata: Metadata = { title: "מרכז הפניות" };
export const dynamic = "force-dynamic";

const secondaryBtn = "inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50";

function AdminHeader({ site }: { site: { id: string; data: { businessName: string } } }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline">← האתרים שלי</Link>
          <h1 className="text-2xl font-extrabold">מרכז הפניות</h1>
          <p className="text-gray-700">{site.data.businessName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/sites/${site.id}/edit`} className={secondaryBtn}>עריכת האתר</Link>
          <Link href={`/sites/${site.id}/preview`} target="_blank" className={secondaryBtn}>צפייה באתר</Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown instead of the real inbox for a Basic site - never renders (or even
 * fetches) any CustomerInteraction data. Nothing is deleted: the moment the
 * site is upgraded, the full history is exactly where it was.
 */
function LockedInboxView({ site }: { site: { id: string; data: { businessName: string } } }) {
  return (
    <>
      <AdminHeader site={site} />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <LockedFeature
          label="מרכז פניות"
          hint="כל הפניות וההודעות מהאתר, במקום אחד, עם עדכון על כל פנייה חדשה. הפניות שכבר התקבלו לא נמחקות - שדרוג לפרו יחשוף אותן מיד."
        />
        <PlanComparison />
      </main>
    </>
  );
}

export default async function SiteAdminPage({ params, searchParams }: PageProps<"/sites/[id]/admin">) {
  const user = await requireUser();
  const { id } = await params;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();

  if (!canAccessInbox(site)) return <LockedInboxView site={site} />;

  // Fetched before anything marks interactions seen, so rows unread as of
  // this page load still show a "חדש" badge for the rest of this visit -
  // the actual seenAt write happens client-side, see AdminInbox.
  const interactions = await listInteractions(user.id, id);
  if (!interactions) notFound();

  const { interaction } = await searchParams;
  const initialInteractionId = typeof interaction === "string" ? interaction : undefined;

  return (
    <>
      <AdminHeader site={site} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <p className="text-gray-700">כל הפניות והלידים שהתקבלו דרך האתר במקום אחד.</p>
        <AdminInbox siteId={site.id} interactions={interactions} initialInteractionId={initialInteractionId} />
      </main>
    </>
  );
}
