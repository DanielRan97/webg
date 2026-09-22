import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnedWebsite } from "@/server/websites";
import { WebsiteRenderer } from "@/templates/WebsiteRenderer";

export const dynamic = "force-dynamic";

/** Owner-only preview: works for drafts and inactive sites, unlike the public /s/[slug] page. */
export default async function OwnerPreviewPage({ params }: PageProps<"/sites/[id]/preview">) {
  const user = await requireUser();
  const { id } = await params;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();
  return <WebsiteRenderer template={site.data.templateId} data={site.data} />;
}

export const metadata = { title: "תצוגה מקדימה", robots: { index: false } };
