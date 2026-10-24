import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedWebsite } from "@/server/websites";
import { isPubliclyVisible } from "@/lib/subscription";
import { publicSiteHref } from "@/lib/site-url";
import { WEBSITE_STATUS } from "@/lib/constants";
import { SiteForm } from "@/components/wizard/SiteForm";
import { SiteActions } from "@/components/SiteActions";
import { phoneVerificationOn, verifiedContacts } from "@/server/contact-verification";

export const metadata: Metadata = { title: "עריכת האתר" };
export const dynamic = "force-dynamic";

export default async function EditPage({ params, searchParams }: PageProps<"/sites/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  const { tab } = await searchParams;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();
  const contacts = { verifiedContacts: await verifiedContacts(site.id), phoneVerification: phoneVerificationOn() };

  // Still mid-wizard (never finished onboarding once): show the bare
  // step-by-step flow, same as a brand-new draft, with no publish/delete
  // controls yet - those only make sense once the owner has actually
  // finished setting the site up at least once.
  if (site.wizardStep) {
    return <SiteForm initial={site.data} siteId={site.id} wizardStep={site.wizardStep} plan={site.plan} {...contacts} />;
  }

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">← האתרים שלי</Link>
            <h1 className="text-2xl font-extrabold">{site.data.businessName}</h1>
          </div>
          <SiteActions id={site.id} slug={site.slug} plan={site.plan} businessName={site.data.businessName} status={site.status} subscriptionStatus={site.subscriptionStatus} templateId={site.data.templateId} />
        </div>
      </div>
      <SiteForm
        initial={site.data}
        siteId={site.id}
        wizardStep={null}
        plan={site.plan}
        liveUrl={isPubliclyVisible(site) ? publicSiteHref(site) : null}
        published={site.status === WEBSITE_STATUS.PUBLISHED}
        initialTab={typeof tab === "string" ? tab : undefined}
        {...contacts}
      />
    </>
  );
}
