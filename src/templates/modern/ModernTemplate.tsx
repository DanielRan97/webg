import { readableOn } from "@/lib/color";
import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { buildVars } from "../engine/palette";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";
import { Logo } from "../shared/Logo";

/** Modern: bright, rounded, soft shadows, full-width photo hero, sticky header. */
const theme: TemplateTheme = {
  body: "font-[family-name:var(--font-heebo)]",
  heading: "",
  media: "rounded-2xl",
  panel: "rounded-3xl p-8 md:p-12",
  card: "rounded-2xl border border-t-line bg-t-surface p-5 shadow-sm",
  rowList: "max-w-2xl divide-y divide-t-line rounded-2xl border border-t-line bg-t-surface",
  row: "flex items-baseline justify-between gap-4 px-5 py-4",
  chip: "rounded-full border border-t-line bg-t-surface px-4 py-2 text-sm font-medium",
  btn: "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition hover:opacity-90",
  btnPrimary: "bg-t-brand text-t-brand-fg",
  btnSecondary: "border-2 border-t-line bg-t-surface text-t-fg",
  btnWhatsApp: "bg-[#15803d] text-white",
  section: "py-14 md:py-20",
  sectionExtra: "",
  container: "mx-auto max-w-5xl",
  titleStyle: "bar",
  center: false,
  narrow: "",
  rhythm: "alt",
  gallery: "mosaic",
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-t-line bg-t-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <a href="#sec-hero" className="flex items-center gap-3 font-bold">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color={d.primaryColor} decorative />
          <span className="max-w-[10rem] truncate sm:max-w-none">{d.businessName}</span>
        </a>
        <nav aria-label="ניווט" className="hidden items-center gap-5 text-sm font-medium lg:flex">
          {nav.map((n) => <a key={n.type} href={`#sec-${n.type}`} className="hover:text-t-accent-text">{n.label}</a>)}
        </nav>
        {d.phone && (
          <a href={telHref(d.phone)} className="rounded-full bg-t-brand px-4 py-2 text-sm font-semibold text-t-brand-fg lg:hidden">התקשרו</a>
        )}
      </div>
    </header>
  );
}

function Hero({ d }: { d: SiteData }) {
  const hasImage = Boolean(d.heroImageUrl);
  const fg = readableOn(d.primaryColor);
  const end = fg === "#ffffff" ? "#000" : "#fff";
  return (
    <section
      id="sec-hero"
      className="relative flex min-h-[70vh] items-center overflow-hidden px-5 py-20"
      style={{ background: `linear-gradient(135deg, var(--t-brand), color-mix(in srgb, var(--t-brand) 80%, ${end}))`, color: hasImage ? "#fff" : fg }}
    >
      {hasImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/50" />
        </>
      )}
      <div className="relative mx-auto w-full max-w-5xl">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight [text-shadow:0_2px_16px_rgb(0_0_0/0.45)] md:text-6xl">{d.businessName}</h1>
        {d.subtitle && <p className="mt-2 text-lg font-semibold opacity-90 [text-shadow:0_1px_10px_rgb(0_0_0/0.4)]">{d.subtitle}</p>}
        {d.description && <p className="mt-5 max-w-xl text-lg [text-shadow:0_1px_10px_rgb(0_0_0/0.4)] md:text-xl">{excerpt(d.description)}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <HeroActions d={d} primary={`${theme.btn} bg-white text-neutral-900`} secondary={`${theme.btn} border-2 border-current`} />
        </div>
      </div>
    </section>
  );
}

export const modernConfig: TemplateConfig = {
  theme,
  palette: (d) => buildVars({ bg: "#ffffff", fg: "#111827", muted: "#4b5563", surface: "#ffffff", line: "#e5e7eb", tint: "#f6f6f6" }, d),
  Header,
  Hero,
};

export function ModernTemplate({ data }: { data: SiteData }) {
  return <TemplateFrame data={data} config={modernConfig} />;
}
