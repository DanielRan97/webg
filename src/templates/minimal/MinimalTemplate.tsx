import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { buildVars } from "../engine/palette";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";

/** Minimal: white space, tight type, hairline dividers, no cards or shadows, small solid buttons. */
const theme: TemplateTheme = {
  body: "font-[family-name:var(--font-assistant)]",
  heading: "font-semibold tracking-tight",
  media: "rounded-none",
  panel: "rounded-none p-8 md:p-10",
  card: "border-b border-t-line py-5",
  rowList: "max-w-2xl divide-y divide-t-line border-y border-t-line",
  row: "flex items-baseline justify-between gap-4 py-4",
  chip: "bg-t-tint px-3 py-1.5 text-sm",
  btn: "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold transition hover:opacity-80",
  btnPrimary: "bg-t-brand text-t-brand-fg",
  btnSecondary: "border border-t-fg text-t-fg",
  btnWhatsApp: "bg-[#15803d] text-white",
  section: "py-12 md:py-16",
  sectionExtra: "",
  container: "mx-auto max-w-3xl",
  titleStyle: "quiet",
  center: false,
  narrow: "",
  rhythm: "lines",
  gallery: "masonry",
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <header className="px-5 py-5">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-6">
        <a href="#sec-hero" className="text-base font-semibold tracking-tight">{d.businessName}</a>
        <nav aria-label="ניווט" className="hidden flex-wrap justify-end gap-x-5 gap-y-1 text-sm text-t-muted lg:flex">
          {nav.map((n) => <a key={n.type} href={`#sec-${n.type}`} className="hover:text-t-fg hover:underline">{n.label}</a>)}
        </nav>
        {d.phone && <a href={telHref(d.phone)} className="text-sm font-semibold underline underline-offset-4 lg:hidden" dir="ltr">{d.phone}</a>}
      </div>
    </header>
  );
}

function Hero({ d }: { d: SiteData }) {
  return (
    <section id="sec-hero" className="px-5 pb-14 pt-10 md:pb-20 md:pt-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">{d.businessName}</h1>
        {d.description && <p className="mt-6 max-w-xl text-lg leading-relaxed text-t-muted md:text-xl">{excerpt(d.description)}</p>}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <HeroActions d={d} primary={`${theme.btn} ${theme.btnPrimary}`} secondary={`${theme.btn} ${theme.btnSecondary}`} />
        </div>
        {d.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.heroImageUrl} alt={d.businessName} className="mt-12 aspect-[21/9] w-full object-cover" />
        )}
      </div>
    </section>
  );
}

export const minimalConfig: TemplateConfig = {
  theme,
  palette: (d) => buildVars({ bg: "#ffffff", fg: "#0a0a0a", muted: "#525252", surface: "#ffffff", line: "#e5e5e5", tint: "#f5f5f5" }, d),
  Header,
  Hero,
};

export function MinimalTemplate({ data }: { data: SiteData }) {
  return <TemplateFrame data={data} config={minimalConfig} />;
}
