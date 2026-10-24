import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedWebsite } from "@/server/websites";
import { CreatedScreen } from "@/components/wizard/CreatedScreen";
import { isPubliclyVisible } from "@/lib/subscription";

export const metadata: Metadata = { title: "האתר שלך מוכן" };
export const dynamic = "force-dynamic";

/**
 * "האתר שלך מוכן" - where the wizard lands after "צור את האתר". It is its own route (not state inside
 * SiteForm) because finishing the wizard re-renders the edit page into its finished-site layout, which
 * remounts SiteForm and would wipe any in-component "just created" state.
 */
export default async function CreatedPage({ params }: PageProps<"/sites/[id]/created">) {
  const user = await requireUser();
  const { id } = await params;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();
  // Not finished yet: nothing to celebrate, back to the wizard.
  if (site.wizardStep) redirect(`/sites/${id}/edit`);
  return (
    <CreatedScreen id={site.id} slug={site.slug} plan={site.plan} businessName={site.data.businessName} templateId={site.data.templateId} alreadyPublished={isPubliclyVisible(site)} />
  );
}
