import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { buildVars } from "../engine/palette";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";
import { Logo } from "../shared/Logo";

/** Bold: solid brand blocks, heavy black outlines, hard shadows, huge chunky type. */
const OUTLINE = "border-[3px] border-black";
const theme: TemplateTheme = {
  body: "font-[family-name:var(--font-rubik)]",
  heading: "font-[family-name:var(--font-secular)] font-normal",
  media: `rounded-md ${OUTLINE}`,
  panel: `rounded-md ${OUTLINE} p-8 shadow-[6px_6px_0_0_#000] md:p-12`,
  card: `rounded-md ${OUTLINE} bg-t-surface p-5 shadow-[5px_5px_0_0_#000]`,
  rowList: `max-w-2xl divide-y-[3px] divide-black rounded-md ${OUTLINE} bg-t-surface shadow-[5px_5px_0_0_#000]`,
  row: "flex items-baseline justify-between gap-4 px-5 py-4 font-semibold",
  chip: `rounded-md ${OUTLINE} bg-t-surface px-4 py-1.5 text-sm font-bold`,
  btn: `inline-flex items-center justify-center gap-2 rounded-md ${OUTLINE} px-6 py-3 text-base font-extrabold shadow-[4px_4px_0_0_#000] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`,
  btnPrimary: "bg-t-brand text-t-brand-fg",
  btnSecondary: "bg-white text-black",
  btnWhatsApp: "bg-[#15803d] text-white",
  section: "py-14 md:py-20",
  sectionExtra: "border-t-[3px] border-black",
  container: "mx-auto max-w-5xl",
  titleStyle: "block",
  center: false,
  narrow: "",
  rhythm: "alt",
  gallery: "bold",
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-black bg-t-brand text-t-brand-fg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <a href="#sec-hero" className="flex items-center gap-3">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color="#ffffff" size={36} decorative />
          <span className="max-w-[10rem] truncate font-[family-name:var(--font-secular)] text-xl sm:max-w-none">{d.businessName}</span>
        </a>
        <nav aria-label="ניווט" className="hidden items-center gap-5 text-sm font-bold lg:flex">
          {nav.map((n) => <a key={n.type} href={`#sec-${n.type}`} className="underline-offset-4 hover:underline">{n.label}</a>)}
        </nav>
        {d.phone && (
          <a href={telHref(d.phone)} className="rounded-md border-[3px] border-black bg-white px-4 py-1.5 text-sm font-extrabold text-black lg:hidden">התקשרו</a>
        )}
      </div>
    </header>
  );
}

function Hero({ d }: { d: SiteData }) {
  return (
    <section id="sec-hero" className="overflow-hidden bg-t-brand px-5 py-14 text-t-brand-fg md:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="font-[family-name:var(--font-secular)] text-5xl leading-[1.05] md:text-8xl">{d.businessName}</h1>
          {d.description && <p className="mt-5 max-w-xl text-lg font-medium md:text-xl">{excerpt(d.description)}</p>}
          <div className="mt-8 flex flex-wrap gap-4">
            <HeroActions d={d} primary={`${theme.btn} bg-black text-white`} secondary={`${theme.btn} bg-white text-black`} />
          </div>
        </div>
        {d.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.heroImageUrl} alt={d.businessName} className="aspect-[4/5] w-full max-w-sm rounded-md border-[3px] border-black object-cover shadow-[8px_8px_0_0_#000] md:justify-self-end" />
        )}
      </div>
    </section>
  );
}

export const boldConfig: TemplateConfig = {
  theme,
  palette: (d) => buildVars({ bg: "#ffffff", fg: "#0a0a0a", muted: "#3f3f46", surface: "#ffffff", line: "#0a0a0a", tint: "#f4f4f0" }, d, { tintFromBrand: true }),
  Header,
  Hero,
};

export function BoldTemplate({ data }: { data: SiteData }) {
  return <TemplateFrame data={data} config={boldConfig} />;
}
