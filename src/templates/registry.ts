import type { ComponentType } from "react";
import type { TemplateId } from "@/lib/constants";
import type { SiteData } from "@/types/site";
import { BoldTemplate } from "./bold/BoldTemplate";
import { DarkTemplate } from "./dark/DarkTemplate";
import { ElegantTemplate } from "./elegant/ElegantTemplate";
import { MinimalTemplate } from "./minimal/MinimalTemplate";
import { ModernTemplate } from "./modern/ModernTemplate";

export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  description: string;
  Component: ComponentType<{ data: SiteData }>;
}

/**
 * All templates render the same SiteData through the same engine (templates/engine).
 * To add one: create its config (theme + header + hero), register it here, and add its id to TEMPLATE_IDS.
 */
export const TEMPLATES: TemplateDefinition[] = [
  { id: "modern", label: "מודרני", description: "בהיר, מעוגל ועדכני", Component: ModernTemplate },
  { id: "elegant", label: "אלגנטי", description: "רגוע, מסוגנן וקלאסי", Component: ElegantTemplate },
  { id: "minimal", label: "מינימלי", description: "נקי ופשוט, הרבה אוויר", Component: MinimalTemplate },
  { id: "bold", label: "בולט", description: "צבעוני, חזק ובעל אופי", Component: BoldTemplate },
  { id: "dark", label: "כהה", description: "כהה, יוקרתי ודרמטי", Component: DarkTemplate },
];

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
