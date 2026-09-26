import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { buildVars } from "../engine/palette";
import { SiteNav } from "../engine/SiteNav";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";
import { Logo } from "../shared/Logo";

/**
 * Noble (Premium): bright editorial boutique. Warm neutral surfaces, an
 * asymmetric split hero with a full-bleed image half, a display serif for
 * every heading, and quieter single-column presentation for testimonials/
 * highlights/portfolio instead of grids of identical boxes.
 */
const theme: TemplateTheme = {
  body: "font-[family-name:var(--font-heebo)]",
  heading: "font-[family-name:var(--font-noto-serif)] font-medium",
  media: "rounded-md",
  panel: "rounded-md p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_44px_-26px_rgba(0,0,0,0.18)] md:p-14",
  card: "rounded-md border border-t-line bg-t-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_14px_30px_-20px_rgba(0,0,0,0.16)] transition hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(0,0,0,0.22)]",
  rowList: "max-w-2xl divide-y divide-t-line rounded-md border border-t-line bg-t-surface shadow-[0_1px_2px_rgba(0,0,0,0.03),0_14px_30px_-20px_rgba(0,0,0,0.16)]",
  row: "flex items-baseline justify-between gap-4 px-6 py-4",
  chip: "rounded-full border border-t-line bg-t-surface px-4 py-2 text-sm tracking-wide",
  btn: "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide transition",
  btnPrimary: "bg-t-brand text-t-brand-fg shadow-[0_14px_28px_-12px_var(--t-brand)] hover:opacity-95",
  btnSecondary: "border border-t-accent bg-transparent text-t-accent-text hover:bg-t-tint",
  btnWhatsApp: "bg-[#15803d] text-white",
  section: "py-20 md:py-28",
  sectionExtra: "",
  container: "mx-auto max-w-6xl",
  titleStyle: "editorial",
  center: false,
  narrow: "",
  rhythm: "alt",
  gallery: "showcase",
  testimonialStyle: "quote",
  highlightStyle: "stat",
  projectStyle: "poster",
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-t-line bg-t-bg/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-6 px-5">
        <a href="#sec-hero" className="flex shrink-0 items-center gap-3">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color={d.primaryColor} decorative />
          <span className="max-w-[10rem] truncate text-lg font-[family-name:var(--font-noto-serif)] font-medium sm:max-w-none">{d.businessName}</span>
        </a>
        <SiteNav nav={nav} linkClassName="text-sm tracking-wide text-t-muted hover:text-t-fg" />
        {d.phone && (
          <a href={telHref(d.phone)} className="shrink-0 text-sm font-semibold tracking-wide underline underline-offset-4 lg:hidden" dir="ltr">{d.phone}</a>
        )}
      </div>
    </header>
  );
}

function Hero({ d }: { d: SiteData }) {
  const hasImage = Boolean(d.heroImageUrl);
  return (
    <section id="sec-hero" className="relative overflow-hidden bg-t-bg">
      <div className={`mx-auto grid max-w-[1440px] ${hasImage ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" : ""}`}>
        <div className={`flex flex-col justify-center gap-1 px-5 py-20 md:py-28 lg:px-16 ${hasImage ? "" : "mx-auto max-w-2xl items-center text-center"}`}>
          {d.subtitle && <span className="text-xs font-semibold tracking-[0.25em] text-t-accent-text">{d.subtitle}</span>}
          <h1 className="max-w-xl text-4xl font-medium leading-[1.1] font-[family-name:var(--font-noto-serif)] md:text-6xl">{d.businessName}</h1>
          {d.description && <p className="mt-5 max-w-md text-lg leading-relaxed text-t-muted">{excerpt(d.description)}</p>}
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <HeroActions
              d={d}
              primary={`${theme.btn} ${theme.btnPrimary}`}
              secondary="text-sm font-semibold tracking-wide text-t-fg underline underline-offset-4 hover:text-t-accent-text"
            />
          </div>
        </div>
        {hasImage && (
          <div className="relative min-h-[320px] md:min-h-[640px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}

export const nobleConfig: TemplateConfig = {
  theme,
  palette: (d) => buildVars({ bg: "#fbfaf6", fg: "#1f1c19", muted: "#6f675c", surface: "#ffffff", line: "#e7e1d4", tint: "#f3efe6" }, d),
  Header,
  Hero,
};

export function NobleTemplate({ data }: { data: SiteData }) {
  return <TemplateFrame data={data} config={nobleConfig} />;
}
