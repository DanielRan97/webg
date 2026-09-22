import type { CSSProperties } from "react";
import { contrastRatio, ensureContrast, luminance, mix, readableOn } from "@/lib/color";
import type { SiteData } from "@/types/site";

export interface Palette {
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  line: string;
  tint: string;
}

/**
 * Turns a template palette plus the owner's colors into CSS variables.
 * - `--t-accent-text` is always readable as text on the page background.
 * - On dark pages, a too-dark brand color is lightened so buttons stay visible.
 */
export function buildVars(base: Palette, d: SiteData, opts: { tintFromBrand?: boolean } = {}): CSSProperties {
  const darkPage = contrastRatio(base.bg, "#000000") < contrastRatio(base.bg, "#ffffff");
  let brand = d.primaryColor;
  let accent = d.secondaryColor || d.primaryColor;
  if (darkPage) {
    brand = ensureContrast(brand, base.bg, 3);
    accent = ensureContrast(accent, base.bg, 4.5);
  }
  const tint = opts.tintFromBrand ? mix(brand, "#ffffff", 0.9) : base.tint;
  // Accent text can sit on the page, on cards or on tinted sections: make it readable on the hardest of them.
  const surfaces = [base.bg, base.surface, tint];
  const hardest = darkPage
    ? surfaces.reduce((a, b) => (luminance(b) > luminance(a) ? b : a))
    : surfaces.reduce((a, b) => (luminance(b) < luminance(a) ? b : a));
  const accentText = ensureContrast(accent, hardest, 4.5);
  return {
    "--t-bg": base.bg,
    "--t-fg": base.fg,
    "--t-muted": base.muted,
    "--t-surface": base.surface,
    "--t-line": base.line,
    "--t-tint": tint,
    "--t-brand": brand,
    "--t-brand-fg": readableOn(brand),
    "--t-accent": accent,
    "--t-accent-text": accentText,
  } as CSSProperties;
}
