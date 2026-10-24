import type { CSSProperties, ReactNode } from "react";
import { NAV_SLOTS, resolveNavLayout, type NavLayout, type NavPart } from "@/lib/nav-layout";
import type { SiteData } from "@/types/site";
import { SiteNav } from "./SiteNav";
import type { NavItem } from "./types";

type Zone = (typeof NAV_SLOTS)[number];

const ZONE_JUSTIFY: Record<Zone, string> = { start: "justify-start", center: "justify-center", end: "justify-end" };

/**
 * Desktop grid columns for the three zones. A zone holding the menu needs real width (SiteNav measures
 * its container to decide how many links fit); with something in the center, the sides stay equal so the
 * center is truly centered; with an empty center, it becomes the flexible gap between the sides.
 * Below lg the menu is only a ☰ button, so the sides just size to their content (MOBILE_COLUMNS).
 */
const MOBILE_COLUMNS = "auto minmax(0,1fr) auto";

function gridColumns(layout: NavLayout, used: Record<Zone, boolean>): string {
  const menuIn = (z: Zone) => layout.menu === z;
  if (used.center) return `minmax(0,1fr) ${menuIn("center") ? "minmax(0,2fr)" : "auto"} minmax(0,1fr)`;
  if (menuIn("start")) return "minmax(0,1fr) 0 auto";
  if (menuIn("end")) return "auto 0 minmax(0,1fr)";
  return "auto minmax(0,1fr) auto";
}

/**
 * Every template's top bar, arranged by the owner's nav layout (or the template's default): logo,
 * business name and menu each sit right / center / left, or are hidden. Templates supply only their
 * own look - the header/container classes and how their logo, name and links render.
 */
export function HeaderBar({
  d,
  nav,
  headerClassName,
  innerClassName,
  logo,
  name,
  linkClassName,
  gapPx,
  mobileExtra,
}: {
  d: SiteData;
  nav: NavItem[];
  headerClassName: string;
  /** The row container: max width, padding, height (may be a flex box for vertical centering). */
  innerClassName: string;
  logo: ReactNode;
  name: ReactNode;
  linkClassName: string;
  gapPx?: number;
  /** Small-screen extra (e.g. a call button), shown after everything else below lg. */
  mobileExtra?: ReactNode;
}) {
  const layout = resolveNavLayout(d.navLayout, d.templateId);
  const showMenu = layout.menu !== "off" && nav.length > 0;
  const zoneOf = (part: NavPart) => (part === "menu" && !showMenu ? "off" : layout[part]);
  const used: Record<Zone, boolean> = {
    start: (["logo", "name", "menu"] as const).some((p) => zoneOf(p) === "start"),
    center: (["logo", "name", "menu"] as const).some((p) => zoneOf(p) === "center"),
    end: (["logo", "name", "menu"] as const).some((p) => zoneOf(p) === "end"),
  };
  const empty = !used.start && !used.center && !used.end;
  if (empty && !mobileExtra) return null;

  // Logo and name side by side form one link to the top of the page; apart, each is its own link.
  const together = zoneOf("logo") !== "off" && zoneOf("logo") === zoneOf("name");
  const brandIn = (zone: Zone): ReactNode => {
    const hasLogo = zoneOf("logo") === zone;
    const hasName = zoneOf("name") === zone;
    if (!hasLogo && !hasName) return null;
    if (together || !hasLogo) {
      return (
        <a href="#sec-hero" className="flex min-w-0 shrink-0 items-center gap-3">
          {hasLogo && logo}
          {hasName && name}
        </a>
      );
    }
    return (
      <a href="#sec-hero" aria-label={d.businessName} className="flex shrink-0 items-center">
        {logo}
      </a>
    );
  };

  return (
    // Everything hidden but a small-screen extra (the call button): no empty bar on desktop.
    <header className={empty ? `${headerClassName} lg:hidden` : headerClassName}>
      <div className={innerClassName}>
        <div
          className="grid w-full items-center gap-2 [grid-template-columns:var(--hb-cols)] sm:gap-4 lg:[grid-template-columns:var(--hb-cols-lg)]"
          style={{ "--hb-cols": MOBILE_COLUMNS, "--hb-cols-lg": gridColumns(layout, used) } as CSSProperties}
        >
          {NAV_SLOTS.map((zone) => (
            <div key={zone} className={`flex min-w-0 items-center gap-2 sm:gap-4 ${ZONE_JUSTIFY[zone]}`}>
              {brandIn(zone)}
              {zoneOf("menu") === zone && <SiteNav nav={nav} linkClassName={linkClassName} gapPx={gapPx} justify={zone} />}
              {zone === "end" && mobileExtra && <div className="flex shrink-0 items-center lg:hidden">{mobileExtra}</div>}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
