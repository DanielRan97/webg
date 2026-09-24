import type { HourData, SectionData, SiteData } from "@/types/site";
import { getCategory } from "./categories";
import { ALL_SECTIONS, type SectionType } from "./sections";

export function defaultHours(): HourData[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    isOpen: day <= 4,
    openTime: "09:00",
    closeTime: day === 5 ? "14:00" : "18:00",
  }));
}

/**
 * All sections for a category: the suggested ones first (in preset order, the
 * preset's defaults switched on), then every other section switched off.
 */
export function sectionsForCategory(categoryId: string): SectionData[] {
  const cat = getCategory(categoryId);
  const rest = ALL_SECTIONS.filter((t) => !cat.sections.includes(t));
  return [...cat.sections, ...rest].map((type) => ({ type, enabled: cat.defaultOn.includes(type) }));
}

/**
 * Keeps existing sites working: a site saved before a section existed simply
 * gets that section appended, switched off. Nothing else changes.
 */
export function withAllSections(current: SectionData[]): SectionData[] {
  const have = new Set<SectionType>(current.map((s) => s.type));
  return [...current, ...ALL_SECTIONS.filter((t) => !have.has(t)).map((type) => ({ type, enabled: false }))];
}

export function emptySiteData(categoryId = "other"): SiteData {
  const cat = getCategory(categoryId);
  return {
    businessName: "",
    slug: "",
    category: cat.id,
    description: "",
    primaryColor: cat.color,
    secondaryColor: "",
    logoUrl: "",
    heroImageUrl: "",
    templateId: "modern",
    subtitle: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    ctaType: cat.cta,
    openSaturday: false,
    openHolidays: false,
    resumeUrl: "",
    services: [],
    hours: defaultHours(),
    gallery: [],
    socials: { instagram: "", facebook: "", tiktok: "", linkedin: "", github: "" },
    testimonials: [],
    areas: [],
    emergency: { available24x7: false, phone: "", message: "" },
    booking: { method: "WHATSAPP", url: "", buttonText: "" },
    faq: [],
    highlights: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    sections: sectionsForCategory(cat.id),
  };
}

/** Values shown in the preview before the user has typed anything. */
export function withPreviewPlaceholders(data: SiteData): SiteData {
  const cat = getCategory(data.category);
  return {
    ...data,
    businessName: data.businessName || "שם העסק שלך",
    description: data.description || cat.tagline,
    services:
      data.services.filter((s) => s.name.trim()).length > 0
        ? data.services
        : cat.sampleServices,
  };
}

/** Hero is always on and always first; duplicates are dropped. */
export function normalizeSections(sections: SectionData[]): SectionData[] {
  const seen = new Set<string>();
  const rest = sections.filter((s) => {
    if (s.type === "hero" || seen.has(s.type)) return false;
    seen.add(s.type);
    return true;
  });
  return [{ type: "hero", enabled: true }, ...rest];
}
