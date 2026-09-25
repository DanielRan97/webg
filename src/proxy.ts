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
 * No wildcard DNS/Vercel domain is configured yet (see the plan/PRO URL
 * report), so in production this never fires today - every request's Host
 * header is still webg.co.il/www.webg.co.il, both excluded below. Once
 * *.webg.co.il is configured, this activates automatically.
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
