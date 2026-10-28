import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedWebsite } from "@/server/websites";
import { listInteractions } from "@/server/interactions";
import { canAccessInbox, inquiryCenterOn, inquiryDelivery, type InquiryDelivery as DeliveryMode } from "@/lib/plan";
import { AdminInbox } from "@/components/AdminInbox";
import { LockedFeature } from "@/components/LockedFeature";
import { UpgradeToPro } from "@/components/PlanChoice";
import { InquiryDelivery } from "@/components/InquiryDelivery";
import { InquirySettings } from "@/components/InquirySettings";
import { ChevronDownIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "מרכז הפניות" };
export const dynamic = "force-dynamic";

const secondaryBtn = "inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-200 shadow-sm bg-white px-4 text-sm font-semibold text-ink-800 transition hover:bg-ink-50";

function AdminHeader({ site }: { site: { id: string; data: { businessName: string } } }) {
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">← האתרים שלי</Link>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">מרכז הפניות</h1>
          <p className="text-ink-700">{site.data.businessName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/sites/${site.id}/edit`} className={secondaryBtn}>עריכת האתר</Link>
          <Link href={`/sites/${site.id}/preview`} target="_blank" className={secondaryBtn}>צפייה באתר</Link>
        </div>
      </div>
    </div>
  );
}

const DELIVERY_SHORT: Record<DeliveryMode, string> = {
  BOTH: "במייל ובמרכז הפניות",
  EMAIL: "במייל בלבד",
  CENTER: "במרכז הפניות בלבד",
};

/**
 * Where inquiries go and how the owner wants them, folded into one panel above the inbox so the
 * inquiries themselves come first. Closed by default; open when the center is off, since then the
 * setting is the only thing on the page that does anything.
 */
function DeliveryPanel({ site, email }: { site: { id: string; plan: string; inquiryDelivery: string }; email: string }) {
  const mode = inquiryDelivery(site);
  return (
    <details open={mode === "EMAIL"} className="group rounded-2xl border border-ink-200 bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 transition hover:bg-ink-50 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-bold text-ink-950">הגדרות קבלת פניות</span>
          <span className="block text-sm text-ink-700">פניות חדשות מגיעות אליכם {DELIVERY_SHORT[mode]}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700">
          <span className="group-open:hidden">שינוי</span>
          <span className="hidden group-open:inline">סגירה</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="space-y-5 border-t border-ink-100 px-4 py-4">
        <InquiryDelivery plan={site.plan} email={email} delivery={site.inquiryDelivery} embedded />
        <div className="border-t border-ink-100 pt-5">
          <InquirySettings siteId={site.id} value={mode} embedded />
        </div>
      </div>
    </details>
  );
}

/**
 * Shown instead of the real inbox for a Basic site - never renders (or even
 * fetches) any CustomerInteraction data. Nothing is deleted: the moment the
 * site is upgraded, the full history is exactly where it was.
 */
function LockedInboxView({ site, email }: { site: { id: string; slug: string; plan: string; data: { businessName: string } }; email: string }) {
  return (
    <>
      <AdminHeader site={site} />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <InquiryDelivery plan={site.plan} email={email} />
        <LockedFeature
          label="מרכז פניות"
          hint="כל הלידים וההודעות מהאתר במקום אחד בתוך WEBG, בנוסף למייל. שום פנייה לא אובדת: גם הפניות שכבר התקבלו יופיעו כאן מיד אחרי מעבר ל-Pro."
        />
        <UpgradeToPro siteId={site.id} slug={site.slug} />
      </main>
    </>
  );
}

export default async function SiteAdminPage({ params, searchParams }: PageProps<"/sites/[id]/admin">) {
  const user = await requireUser();
  const { id } = await params;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();

  if (!canAccessInbox(site)) return <LockedInboxView site={site} email={user.email} />;

  // Fetched before anything marks interactions seen, so rows unread as of
  // this page load still show a "חדש" badge for the rest of this visit -
  // the actual seenAt write happens client-side, see AdminInbox.
  // Center switched off by the owner: nothing is fetched or shown until it is switched back on.
  const centerOn = inquiryCenterOn(site);
  const interactions = centerOn ? await listInteractions(user.id, id) : [];
  if (!interactions) notFound();

  const { interaction } = await searchParams;
  const initialInteractionId = typeof interaction === "string" ? interaction : undefined;

  return (
    <>
      <AdminHeader site={site} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <DeliveryPanel site={site} email={user.email} />
        {centerOn ? (
          <AdminInbox siteId={site.id} interactions={interactions} initialInteractionId={initialInteractionId} />
        ) : (
          <p className="rounded-xl border border-dashed border-ink-300 bg-white p-6 text-center text-ink-700">
            מרכז הפניות כבוי, ולכן הפניות לא מוצגות כאן. הן מגיעות אליכם במייל וממשיכות להישמר. כדי לראות אותן כאן, בחרו ב״הגדרות קבלת פניות״ למעלה ״גם במייל וגם במרכז הפניות״.
          </p>
        )}
      </main>
    </>
  );
}
