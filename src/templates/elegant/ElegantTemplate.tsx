import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { buildVars } from "../engine/palette";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";
import { Logo } from "../shared/Logo";

/** Elegant: warm paper background, serif headings, square corners, hairlines, everything centered. */
const theme: TemplateTheme = {
  body: "font-[family-name:var(--font-assistant)]",
  heading: "font-[family-name:var(--font-frank)] font-medium",
  media: "rounded-none",
  panel: "rounded-none p-10 md:p-14",
  card: "border border-t-line bg-t-surface p-6",
  rowList: "max-w-2xl",
  row: "flex items-baseline justify-between gap-4 border-b border-dotted border-t-fg/30 py-4",
  chip: "border border-t-line bg-t-surface px-5 py-2 text-sm tracking-wide",
  btn: "inline-flex items-center justify-center gap-2 border px-8 py-3.5 text-sm font-semibold tracking-widest transition hover:opacity-85",
  btnPrimary: "border-t-brand bg-t-brand text-t-brand-fg",
  btnSecondary: "border-t-fg bg-transparent text-t-fg",
  btnWhatsApp: "border-[#15803d] bg-[#15803d] text-white",
  section: "py-20 md:py-28",
  sectionExtra: "",
  container: "mx-auto max-w-4xl",
  titleStyle: "ornament",
  center: true,
  narrow: "mx-auto",
  rhythm: "alt",
  gallery: "uniform",
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <header className="border-b border-t-line bg-t-bg">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-5">
        <a href="#sec-hero" className="flex items-center gap-3">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color={d.primaryColor} size={36} decorative />
          <span className="font-[family-name:var(--font-frank)] text-2xl font-medium">{d.businessName}</span>
        </a>
        <nav aria-label="ניווט" className="hidden flex-wrap justify-center gap-x-7 gap-y-1 text-sm tracking-wide lg:flex">
          {nav.map((n) => <a key={n.type} href={`#sec-${n.type}`} className="text-t-muted hover:text-t-fg">{n.label}</a>)}
        </nav>
        {d.phone && <a href={telHref(d.phone)} className="text-sm font-semibold underline underline-offset-4 lg:hidden" dir="ltr">{d.phone}</a>}
      </div>
    </header>
  );
}

function Hero({ d }: { d: SiteData }) {
  return (
    <section id="sec-hero" className="bg-t-tint px-5 pb-16 pt-16 text-center md:pb-24 md:pt-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-frank)] text-5xl font-medium leading-tight md:text-7xl">{d.businessName}</h1>
        <span aria-hidden className="mx-auto mt-6 flex w-40 items-center gap-3">
          <span className="h-px flex-1 bg-t-line" />
          <span className="h-1.5 w-1.5 rotate-45 bg-t-accent" />
          <span className="h-px flex-1 bg-t-line" />
        </span>
        {d.description && <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-t-muted md:text-xl">{excerpt(d.description)}</p>}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <HeroActions d={d} primary={`${theme.btn} ${theme.btnPrimary}`} secondary={`${theme.btn} ${theme.btnSecondary}`} />
        </div>
      </div>
      {d.heroImageUrl && (
        <div className="mx-auto mt-14 max-w-5xl border border-t-line bg-t-surface p-2 md:p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.heroImageUrl} alt={`${d.businessName}`} className="aspect-[16/9] w-full object-cover" />
        </div>
      )}
    </section>
  );
}

export const elegantConfig: TemplateConfig = {
  theme,
  palette: (d) => buildVars({ bg: "#faf7f2", fg: "#2b2622", muted: "#6b625a", surface: "#fffdf9", line: "#e4dccf", tint: "#f2ece2" }, d),
  Header,
  Hero,
};

export function ElegantTemplate({ data }: { data: SiteData }) {
  return <TemplateFrame data={data} config={elegantConfig} />;
}
