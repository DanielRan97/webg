import { telHref } from "@/lib/links";
import type { SiteData } from "@/types/site";
import { primaryCta } from "../shared/helpers";

/** Cuts at a word boundary so the hero never ends mid-word. */
export function excerpt(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[\s,.;:-]+$/, "") + "…";
}

/** The hero's main button and (when it isn't the call button) the phone number. Classes come from the template. */
export function HeroActions({
  d,
  primary,
  secondary,
}: {
  d: SiteData;
  primary: string;
  secondary: string;
}) {
  const cta = primaryCta(d);
  return (
    <>
      {cta && (
        <a href={cta.href} {...(cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={primary}>
          {cta.label}
        </a>
      )}
      {d.phone && d.ctaType !== "CALL" && (
        <a href={telHref(d.phone)} className={secondary}>
          <span dir="ltr">{d.phone}</span>
        </a>
      )}
    </>
  );
}
