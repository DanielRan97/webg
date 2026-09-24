import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedWebsite } from "@/server/websites";
import { isPubliclyVisible } from "@/lib/subscription";
import { SiteForm } from "@/components/wizard/SiteForm";
import { SiteActions } from "@/components/SiteActions";

export const metadata: Metadata = { title: "עריכת האתר" };
export const dynamic = "force-dynamic";

export default async function EditPage({ params }: PageProps<"/sites/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();

  return (
    <>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline">← האתרים שלי</Link>
            <h1 className="text-2xl font-extrabold">{site.data.businessName}</h1>
          </div>
          <SiteActions id={site.id} slug={site.slug} businessName={site.data.businessName} status={site.status} subscriptionStatus={site.subscriptionStatus} />
        </div>
      </div>
      <SiteForm
        initial={site.data}
        siteId={site.id}
        liveUrl={isPubliclyVisible(site) ? `/s/${site.slug}` : null}
      />
    </>
  );
}
