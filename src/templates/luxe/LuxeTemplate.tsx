import { ensureContrast } from "@/lib/color";
import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { buildVars } from "../engine/palette";
import { SiteNav } from "../engine/SiteNav";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";
import { Logo } from "../shared/Logo";

/**
 * Luxe (Premium): dark, cinematic, restrained. A warm espresso-toned near-
 * black (not Dark's cool blue-black), sharp-cornered surfaces with a single
 * glowing accent dot per section, a bottom-anchored full-bleed hero, and the
 * same quieter quote/stat/poster presentation as Noble for testimonials,
 * highlights and portfolio work.
 */
const BG = "#0f0d0c";
const theme: TemplateTheme = {
  body: "font-[family-name:var(--font-heebo)]",
  heading: "font-black tracking-tight",
  media: "rounded-none",
  panel: "rounded-none p-10 md:p-14",
  card: "rounded-none border border-t-line bg-t-surface p-6 transition hover:border-t-accent hover:shadow-[0_28px_52px_-30px_rgba(0,0,0,0.75)]",
  rowList: "max-w-2xl divide-y divide-t-line rounded-none border border-t-line bg-t-surface",
  row: "flex items-baseline justify-between gap-4 px-6 py-4",
  chip: "rounded-none border border-t-line bg-t-surface px-4 py-2 text-sm tracking-wide text-t-muted",
  btn: "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide transition",
  btnPrimary: "bg-t-brand text-t-brand-fg hover:shadow-[0_0_40px_-10px_var(--t-brand)]",
  btnSecondary: "border border-t-line text-t-fg hover:border-t-accent",
  btnWhatsApp: "bg-[#15803d] text-white",
  section: "py-20 md:py-28",
  sectionExtra: "",
  container: "mx-auto max-w-6xl",
  titleStyle: "cinema",
  center: false,
  narrow: "",
  rhythm: "lines",
  gallery: "showcase",
  testimonialStyle: "quote",
  highlightStyle: "stat",
  projectStyle: "poster",
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-t-line bg-t-bg/85 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-6 px-5">
        <a href="#sec-hero" className="flex shrink-0 items-center gap-3">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color={ensureContrast(d.primaryColor, BG, 3)} decorative />
          <span className="max-w-[10rem] truncate text-lg font-black tracking-tight sm:max-w-none">{d.businessName}</span>
        </a>
        <SiteNav nav={nav} linkClassName="text-sm tracking-wide text-t-muted hover:text-t-fg" />
        {d.phone && (
          <a href={telHref(d.phone)} className="shrink-0 rounded-full bg-t-brand px-4 py-2 text-sm font-semibold text-t-brand-fg lg:hidden">התקשרו</a>
        )}
      </div>
    </header>
  );
}

function Hero({ d }: { d: SiteData }) {
  const hasImage = Boolean(d.heroImageUrl);
  return (
    <section id="sec-hero" className="relative flex min-h-[88vh] items-end overflow-hidden px-5 pb-16 pt-28 md:pb-24">
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/55 to-t-bg/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-t-bg/50 via-transparent to-transparent" />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 70% at 85% 100%, color-mix(in srgb, var(--t-brand) 32%, transparent), transparent 70%)" }}
        />
      )}
      <div className="relative mx-auto w-full max-w-6xl">
        {d.subtitle && <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-t-accent-text">{d.subtitle}</p>}
        <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight md:text-8xl">{d.businessName}</h1>
        {d.description && <p className="mt-6 max-w-lg text-lg text-t-muted md:text-xl">{excerpt(d.description)}</p>}
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <HeroActions
            d={d}
            primary={`${theme.btn} ${theme.btnPrimary}`}
            secondary="text-sm font-semibold tracking-wide text-t-fg/80 underline underline-offset-4 hover:text-t-fg"
          />
        </div>
      </div>
    </section>
  );
}

export const luxeConfig: TemplateConfig = {
  theme,
  palette: (d) => buildVars({ bg: BG, fg: "#f5f1ea", muted: "#a89e8f", surface: "#1a1613", line: "#2e2822", tint: "#161210" }, d),
  Header,
  Hero,
};

export function LuxeTemplate({ data }: { data: SiteData }) {
  return <TemplateFrame data={data} config={luxeConfig} />;
}
