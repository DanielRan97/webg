import type { ComponentType } from "react";
import { TEMPLATE_TIERS, type TemplateId } from "@/lib/constants";
import type { SiteData } from "@/types/site";
import { BoldTemplate } from "./bold/BoldTemplate";
import { DarkTemplate } from "./dark/DarkTemplate";
import { ElegantTemplate } from "./elegant/ElegantTemplate";
import { LuxeTemplate } from "./luxe/LuxeTemplate";
import { MinimalTemplate } from "./minimal/MinimalTemplate";
import { ModernTemplate } from "./modern/ModernTemplate";
import { NobleTemplate } from "./noble/NobleTemplate";

export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  description: string;
  Component: ComponentType<{ data: SiteData }>;
  /** Which plan this template requires - see TEMPLATE_TIERS in @/lib/constants, the single source of truth (also used server-side). */
  tier: "standard" | "premium";
}

/**
 * All templates render the same SiteData through the same engine (templates/engine).
 * To add one: create its config (theme + header + hero), register it here, and add its id to TEMPLATE_IDS.
 */
export const TEMPLATES: TemplateDefinition[] = [
  { id: "modern", label: "מודרני", description: "בהיר, מעוגל ועדכני", Component: ModernTemplate, tier: TEMPLATE_TIERS.modern },
  { id: "elegant", label: "אלגנטי", description: "רגוע, מסוגנן וקלאסי", Component: ElegantTemplate, tier: TEMPLATE_TIERS.elegant },
  { id: "minimal", label: "מינימלי", description: "נקי ופשוט, הרבה אוויר", Component: MinimalTemplate, tier: TEMPLATE_TIERS.minimal },
  { id: "bold", label: "בולט", description: "צבעוני, חזק ובעל אופי", Component: BoldTemplate, tier: TEMPLATE_TIERS.bold },
  { id: "dark", label: "כהה", description: "כהה, נועז ודרמטי", Component: DarkTemplate, tier: TEMPLATE_TIERS.dark },
  { id: "noble", label: "אצילי", description: "בהיר, מלוטש ומרשים", Component: NobleTemplate, tier: TEMPLATE_TIERS.noble },
  { id: "luxe", label: "יוקרתי", description: "עמוק, קולנועי ומהוקצע", Component: LuxeTemplate, tier: TEMPLATE_TIERS.luxe },
];

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
