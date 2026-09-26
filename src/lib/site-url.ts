import { PLAN } from "./constants";
import { SLUG_BASE } from "./slug-format";

export interface PublicUrlSite {
  slug: string;
  plan: string;
}

/** The Basic-form address, regardless of a site's actual plan - e.g. "webg.co.il/s/danielbarber". */
export function basicUrlDisplay(slug: string): string {
  return `${SLUG_BASE}${slug}`;
}

/** The Pro-form address, regardless of a site's actual plan - e.g. "danielbarber.webg.co.il". */
export function proUrlDisplay(slug: string): string {
  return `${slug}.webg.co.il`;
}

/**
 * A site's current primary public address, as shown/copied throughout WEBG -
 * bare domain, no protocol (matches how SLUG_BASE has always been shown).
 * The single source of truth for "which URL form is this site's address right
 * now" - every surface that displays or copies a site's URL should call this
 * instead of inlining its own plan check.
 */
export function publicSiteUrlDisplay(site: PublicUrlSite): string {
  return site.plan === PLAN.PRO ? proUrlDisplay(site.slug) : basicUrlDisplay(site.slug);
}

/**
 * Where "open site"/"view live site" should actually navigate for a site's
 * current plan. Basic stays a same-origin relative path (works on any host,
 * dev or prod, since /s/[slug] is the shared render path for both plans);
 * Pro is the real external subdomain - the *.webg.co.il wildcard DNS/Vercel
 * domain is configured in production, so this resolves for real (see
 * src/proxy.ts).
 */
export function publicSiteHref(site: PublicUrlSite): string {
  return site.plan === PLAN.PRO ? `https://${proUrlDisplay(site.slug)}` : `/s/${site.slug}`;
}
