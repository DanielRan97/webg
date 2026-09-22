import type { ComponentType, CSSProperties } from "react";
import type { SectionType } from "@/lib/sections";
import type { SiteData } from "@/types/site";

export type GalleryLayout = "mosaic" | "uniform" | "masonry" | "bold" | "feature";
export type TitleStyle = "bar" | "ornament" | "quiet" | "block" | "glow";

/**
 * What makes one template look different from another. Every section is
 * implemented once (engine/Sections.tsx) and styled with these class strings.
 * Colors come from CSS variables (see palette.ts), so any brand color stays readable.
 */
export interface TemplateTheme {
  body: string;
  heading: string;
  /** Rounded corners / border for images and maps. */
  media: string;
  /** Large highlighted blocks (booking, emergency). */
  panel: string;
  card: string;
  rowList: string;
  row: string;
  chip: string;
  btn: string;
  btnPrimary: string;
  btnSecondary: string;
  btnWhatsApp: string;
  section: string;
  sectionExtra: string;
  container: string;
  titleStyle: TitleStyle;
  center: boolean;
  /** "mx-auto" for centered templates, so narrow blocks sit in the middle. */
  narrow: string;
  rhythm: "alt" | "lines" | "plain";
  gallery: GalleryLayout;
}

export interface NavItem {
  type: SectionType;
  label: string;
}

export interface TemplateConfig {
  theme: TemplateTheme;
  palette: (d: SiteData) => CSSProperties;
  Header: ComponentType<{ d: SiteData; nav: NavItem[] }>;
  Hero: ComponentType<{ d: SiteData }>;
}
