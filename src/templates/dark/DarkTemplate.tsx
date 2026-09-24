import { ensureContrast } from "@/lib/color";
import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { buildVars } from "../engine/palette";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";
import { Logo } from "../shared/Logo";

/** Dark: near-black surfaces, light type, glowing brand accents, one large lead photo in the gallery. */
const BG = "#0d0d12";
const theme: TemplateTheme = {
  body: "font-[family-name:var(--font-heebo)]",
  heading: "font-light tracking-tight",
  media: "rounded-xl",
  panel: "rounded-2xl p-8 md:p-12",
  card: "rounded-xl border border-t-line bg-t-surface p-5 transition hover:border-t-accent",
  rowList: "max-w-2xl divide-y divide-t-line rounded-xl border border-t-line bg-t-surface",
  row: "flex items-baseline justify-between gap-4 px-5 py-4",
  chip: "rounded-full border border-t-line bg-t-surface px-4 py-2 text-sm",
  btn: "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition hover:brightness-110",
  btnPrimary: "bg-t-brand text-t-brand-fg shadow-[0_0_24px_-6px_var(--t-brand)]",
  btnSecondary: "border border-t-line bg-t-surface text-t-fg",
  btnWhatsApp: "bg-[#15803d] text-white",
  section: "py-16 md:py-24",
  sectionExtra: "",
  container: "mx-auto max-w-5xl",
  titleStyle: "glow",
  center: false,
  narrow: "",
  rhythm: "alt",
  gallery: "feature",
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-t-line bg-t-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <a href="#sec-hero" className="flex items-center gap-3 font-semibold">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color={ensureContrast(d.primaryColor, BG, 3)} decorative />
          <span className="max-w-[10rem] truncate sm:max-w-none">{d.businessName}</span>
        </a>
        <nav aria-label="ניווט" className="hidden items-center gap-5 text-sm lg:flex">
          {nav.map((n) => <a key={n.type} href={`#sec-${n.type}`} className="text-t-muted hover:text-t-fg">{n.label}</a>)}
        </nav>
        {d.phone && (
          <a href={telHref(d.phone)} className="rounded-full bg-t-brand px-4 py-2 text-sm font-semibold text-t-brand-fg lg:hidden">התקשרו</a>
        )}
      </div>
    </header>
  );
}

function Hero({ d }: { d: SiteData }) {
  return (
    <section
      id="sec-hero"
      className="relative flex min-h-[75vh] items-end overflow-hidden px-5 pb-16 pt-24 md:items-center md:pb-24"
      style={{ background: "radial-gradient(70% 90% at 15% 0%, color-mix(in srgb, var(--t-brand) 45%, transparent), transparent 70%), var(--t-bg)" }}
    >
      {d.heroImageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-t-bg via-t-bg/60 to-t-bg/20" />
        </>
      )}
      <div className="relative mx-auto w-full max-w-5xl">
        <span aria-hidden className="mb-6 block h-1 w-16 rounded-full bg-t-accent shadow-[0_0_20px_var(--t-accent)]" />
        <h1 className="max-w-3xl text-5xl font-light leading-[1.05] tracking-tight md:text-7xl">{d.businessName}</h1>
        {d.subtitle && <p className="mt-3 text-lg text-t-fg">{d.subtitle}</p>}
        {d.description && <p className="mt-6 max-w-xl text-lg text-t-muted md:text-xl">{excerpt(d.description)}</p>}
        <div className="mt-9 flex flex-wrap gap-3">
          <HeroActions d={d} primary={`${theme.btn} ${theme.btnPrimary}`} secondary={`${theme.btn} ${theme.btnSecondary}`} />
        </div>
      </div>
    </section>
  );
}

export const darkConfig: TemplateConfig = {
  theme,
  palette: (d) => buildVars({ bg: BG, fg: "#f4f4f5", muted: "#a1a1aa", surface: "#16161d", line: "#2a2a35", tint: "#101017" }, d),
  Header,
  Hero,
};

export function DarkTemplate({ data }: { data: SiteData }) {
  return <TemplateFrame data={data} config={darkConfig} />;
}
