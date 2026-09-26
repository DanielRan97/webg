import { NextResponse, type NextRequest } from "next/server";

const RESERVED_SUBDOMAINS = new Set(["www"]);

/**
 * Routes a WEBG Pro vanity subdomain (e.g. danielbarber.webg.co.il) to the
 * same public page an existing /s/[slug] path already renders - pure
 * hostname parsing, no database access. Whether the site is actually
 * allowed to use that subdomain (i.e. is on WEBG Pro) is enforced
 * downstream in src/app/s/[slug]/page.tsx, which has full DB access; this
 * file only ever decides *where* to route the request, never *whether*
 * it's allowed.
 *
 * The *.webg.co.il wildcard DNS and Vercel domain are configured, so this
 * fires for real in production for any Pro site's subdomain. webg.co.il and
 * www.webg.co.il are excluded below since those are the app's own host, not
 * a site's subdomain.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const suffix = ".webg.co.il";
  if (!hostname.endsWith(suffix)) return NextResponse.next();

  const subdomain = hostname.slice(0, -suffix.length);
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain) || !/^[a-z0-9-]{1,40}$/.test(subdomain)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/s/${subdomain}`;
  const headers = new Headers(request.headers);
  headers.set("x-webg-subdomain", subdomain);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
