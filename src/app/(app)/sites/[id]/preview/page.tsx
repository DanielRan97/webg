import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedWebsite } from "@/server/websites";
import { displayState } from "@/lib/subscription";
import { WebsiteRenderer } from "@/templates/WebsiteRenderer";
import { OwnerPreviewBar } from "@/components/OwnerPreviewBar";

export const dynamic = "force-dynamic";

/** Owner-only preview: works for drafts and inactive sites, unlike the public /s/[slug] page. */
export default async function OwnerPreviewPage({ params }: PageProps<"/sites/[id]/preview">) {
  const user = await requireUser();
  const { id } = await params;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();
  return (
    <>
      <OwnerPreviewBar
        id={site.id}
        slug={site.slug}
        plan={site.plan}
        templateId={site.data.templateId}
        state={displayState(site)}
      />
      {/* The app's own sticky header (h-16) sits above the site, so the site's sticky bar stops under it. */}
      <div style={{ "--webg-site-top": "4rem" } as CSSProperties}>
        <WebsiteRenderer template={site.data.templateId} data={site.data} />
      </div>
    </>
  );
}

export const metadata = { title: "תצוגה מקדימה", robots: { index: false } };
