import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWebsiteBySlug } from "@/server/websites";
import { isPubliclyVisible } from "@/lib/subscription";
import { WebsiteRenderer } from "@/templates/WebsiteRenderer";
import { getCategory } from "@/lib/categories";

// Always read fresh data so publish / subscription changes apply immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const site = await getWebsiteBySlug(slug);
  if (!site || !isPubliclyVisible(site)) {
    return { title: "האתר לא זמין", robots: { index: false, follow: false } };
  }
  const d = site.data;
  const cat = getCategory(d.category);
  const title = `${d.businessName}${d.city ? ` - ${cat.label} ב${d.city}` : ` - ${cat.label}`}`;
  const description = d.description.slice(0, 155) || cat.tagline;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, locale: "he_IL", type: "website", images: d.heroImageUrl ? [d.heroImageUrl] : undefined },
  };
}

export default async function PublicSitePage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const site = await getWebsiteBySlug(slug);
  if (!site) notFound();

  if (!isPubliclyVisible(site)) {
    // Data is kept; visitors just see that the site is unavailable.
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
        <h1 className="text-3xl font-bold">האתר לא זמין כרגע</h1>
        <p className="max-w-md text-gray-600">האתר הזה אינו פעיל בשלב זה. נסו שוב מאוחר יותר.</p>
      </main>
    );
  }

  const d = site.data;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: d.businessName,
    description: d.description || undefined,
    telephone: d.phone || undefined,
    email: d.email || undefined,
    image: d.heroImageUrl || d.logoUrl || undefined,
    address: d.address || d.city ? { "@type": "PostalAddress", streetAddress: d.address, addressLocality: d.city, addressCountry: "IL" } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <WebsiteRenderer template={d.templateId} data={d} />
    </>
  );
}
