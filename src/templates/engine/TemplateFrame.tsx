import { SECTION_META } from "@/lib/sections";
import { telHref, whatsappHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { ChatIcon, PhoneIcon } from "../shared/Icons";
import { visibleSections } from "../shared/helpers";
import { NavPortalProvider } from "./nav-portal";
import { SectionFrame, renderSectionBody } from "./Sections";
import type { NavItem, TemplateConfig } from "./types";

/** Not worth a menu link: these are secondary and would crowd the header. */
const NOT_IN_NAV = new Set(["social", "highlights"]);

/**
 * The single page skeleton shared by every template: header, hero, sections,
 * footer and the mobile call bar. A template plugs in its theme, palette,
 * header and hero.
 */
export function TemplateFrame({ data: d, config }: { data: SiteData; config: TemplateConfig }) {
  const { theme: t, palette, Header, Hero } = config;
  const sections = visibleSections(d);
  const pricesVisible = sections.some((s) => s.type === "prices");
  const nav: NavItem[] = sections
    .filter((s) => s.type !== "hero" && !NOT_IN_NAV.has(s.type))
    .map((s) => ({ type: s.type, label: SECTION_META[s.type].label }));
  const wa = d.whatsapp || d.phone;
  let bodyIndex = 0;

  return (
    <div dir="rtl" lang="he" style={palette(d)} className={`min-h-screen scroll-smooth bg-t-bg pb-20 text-t-fg md:pb-0 ${t.body}`}>
      <NavPortalProvider>
        <Header d={d} nav={nav} />
        <main>
          {sections.map((s) =>
            s.type === "hero" ? (
              <Hero key="hero" d={d} />
            ) : (
              <SectionFrame key={s.type} type={s.type} index={bodyIndex++} t={t}>
                {renderSectionBody(s.type, { d, t, pricesVisible })}
              </SectionFrame>
            ),
          )}
        </main>

        <footer className="border-t border-t-line px-5 py-8 text-center text-sm text-t-muted">
          © {new Date().getFullYear()} {d.businessName}
        </footer>

        {(d.phone || wa) && (
          <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-t-line bg-t-bg p-3 md:hidden">
            {d.phone && (
              <a href={telHref(d.phone)} className={`${t.btn} ${t.btnPrimary} flex-1`}><PhoneIcon /> התקשרו</a>
            )}
            {wa && (
              <a href={whatsappHref(wa)} target="_blank" rel="noopener noreferrer" className={`${t.btn} ${t.btnWhatsApp} flex-1`}><ChatIcon /> WhatsApp</a>
            )}
          </div>
        )}
      </NavPortalProvider>
    </div>
  );
}
