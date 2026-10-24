import { readableOn } from "@/lib/color";
import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { HeroActions, excerpt } from "../engine/hero-parts";
import { formatPrice } from "../shared/helpers";
import { buildVars } from "../engine/palette";
import { HeaderBar } from "../engine/HeaderBar";
import { TemplateFrame } from "../engine/TemplateFrame";
import type { NavItem, TemplateConfig, TemplateTheme } from "../engine/types";
import { Logo } from "../shared/Logo";

/** Modern: bright, rounded, soft shadows, full-width photo hero, sticky header; on wide screens titles sit beside their content. */
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
  container: "mx-auto max-w-6xl",
  titleStyle: "bar",
  center: false,
  narrow: "",
  rhythm: "alt",
  gallery: "mosaic",
  split: true,
};

function Header({ d, nav }: { d: SiteData; nav: NavItem[] }) {
  return (
    <HeaderBar
      d={d}
      nav={nav}
      headerClassName="border-b border-t-line bg-t-bg/90 backdrop-blur"
      innerClassName="mx-auto max-w-6xl px-5 py-3"
      logo={<Logo logoUrl={d.logoUrl} name={d.businessName} color={d.primaryColor} decorative />}
      name={<span className="max-w-[10rem] truncate font-bold sm:max-w-none">{d.businessName}</span>}
      linkClassName="text-sm font-medium hover:text-t-accent-text"
      mobileExtra={d.phone ? <a href={telHref(d.phone)} className="shrink-0 rounded-full bg-t-brand px-4 py-2 text-sm font-semibold text-t-brand-fg">התקשרו</a> : undefined}
    />
  );
}

/**
 * Wide screens without a hero photo: a short card of real details beside the text, so the hero's
 * other half isn't empty. Hidden below lg; not rendered when there is nothing to list (see hasFacts).
 */
const hasFacts = (d: SiteData) => d.services.some((s) => s.name.trim()) || Boolean(d.address || d.city || d.phone);

function FactsCard({ d }: { d: SiteData }) {
  const items = d.services.filter((s) => s.name.trim()).slice(0, 3);
  const place = [d.address, d.city].filter(Boolean).join(", ");
  return (
    <div className="hidden w-full rounded-3xl border border-current/20 bg-current/5 p-6 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)] backdrop-blur lg:block">
      {items.length > 0 && (
        <ul className="divide-y divide-current/15">
          {items.map((s, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
              <span className="font-semibold">{s.name}</span>
              {s.price && <span className="shrink-0 font-bold">{formatPrice(s.price)}</span>}
            </li>
          ))}
        </ul>
      )}
      {(place || d.phone) && (
        <div className={items.length ? "mt-4 space-y-1.5 border-t border-current/15 pt-4 text-sm opacity-90" : "space-y-1.5 text-sm opacity-90"}>
          {place && <p>{place}</p>}
          {d.phone && <p dir="ltr" className="text-end">{d.phone}</p>}
        </div>
      )}
    </div>
  );
}

function Hero({ d }: { d: SiteData }) {
  const hasImage = Boolean(d.heroImageUrl);
  const facts = !hasImage && hasFacts(d);
  const fg = readableOn(d.primaryColor);
  const end = fg === "#ffffff" ? "#000" : "#fff";
  return (
    <section
      id="sec-hero"
      className="relative flex min-h-[70vh] items-center overflow-hidden px-5 py-20 lg:min-h-[62vh]"
      style={{ background: `linear-gradient(135deg, var(--t-brand), color-mix(in srgb, var(--t-brand) 80%, ${end}))`, color: hasImage ? "#fff" : fg }}
    >
      {hasImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {/* Dark only where the text is (bottom on phones, the start side on wide screens), so the photo stays clear. */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/25 md:bg-linear-to-l md:from-black/75 md:via-black/40 md:to-black/5" />
        </>
      )}
      <div className={`relative mx-auto grid w-full max-w-6xl items-center gap-10 ${facts ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
        <div>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight [text-shadow:0_2px_16px_rgb(0_0_0/0.45)] md:text-6xl">{d.businessName}</h1>
        {d.subtitle && <p className="mt-2 text-lg font-semibold opacity-90 [text-shadow:0_1px_10px_rgb(0_0_0/0.4)]">{d.subtitle}</p>}
        {d.description && <p className="mt-5 max-w-xl text-lg [text-shadow:0_1px_10px_rgb(0_0_0/0.4)] md:text-xl">{excerpt(d.description)}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <HeroActions d={d} primary={`${theme.btn} bg-white text-neutral-900`} secondary={`${theme.btn} border-2 border-current`} />
        </div>
        </div>
        {facts && <FactsCard d={d} />}
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
