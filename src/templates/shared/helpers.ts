import { CTA_OPTIONS } from "@/lib/constants";
import { normalizeUrl, telHref, whatsappHref } from "@/lib/links";
import type { SectionType } from "@/lib/sections";
import type { ServiceData, SiteData } from "@/types/site";

export interface Cta {
  label: string;
  href: string;
  external: boolean;
}

/** The booking button, or null if the owner has not given enough details for it to work. */
export function bookingCta(d: SiteData): Cta | null {
  const label = d.booking.buttonText.trim() || "קבעו תור";
  const wa = d.whatsapp || d.phone;
  switch (d.booking.method) {
    case "PHONE":
      return d.phone ? { label, href: telHref(d.phone), external: false } : null;
    case "LINK":
      return d.booking.url.trim() ? { label, href: normalizeUrl(d.booking.url), external: true } : null;
    default:
      return wa ? { label, href: whatsappHref(wa, `שלום, אשמח לקבוע תור ב${d.businessName}`), external: true } : null;
  }
}

/** The main "what should customers do" button, with graceful fallbacks when a contact detail is missing. */
export function primaryCta(d: SiteData): Cta | null {
  const label = CTA_OPTIONS.find((o) => o.value === d.ctaType)?.button ?? "צרו קשר";
  const wa = d.whatsapp || d.phone;
  const call: Cta | null = d.phone ? { label: "התקשרו עכשיו", href: telHref(d.phone), external: false } : null;
  const whatsapp = (text?: string): Cta | null =>
    wa ? { label, href: whatsappHref(wa, text), external: true } : null;
  const message: Cta | null = d.email
    ? { label, href: `mailto:${d.email}`, external: false }
    : { label, href: "#sec-contact", external: false };

  switch (d.ctaType) {
    case "CALL":
      return call ?? whatsapp() ?? message;
    case "BOOKING":
      return bookingCta(d) ?? whatsapp(`שלום, אשמח לקבוע תור ב${d.businessName}`) ?? call ?? message;
    case "MESSAGE":
      return message.href.startsWith("mailto") ? message : whatsapp() ?? call ?? message;
    default:
      return whatsapp() ?? call ?? message;
  }
}

/** Whether a section has anything worth showing. Empty sections are skipped even if switched on. */
export function sectionHasContent(type: SectionType, d: SiteData): boolean {
  switch (type) {
    case "hero":
      return true;
    case "about":
      return d.description.trim().length > 0;
    case "services":
    case "menu":
      return d.services.some((s) => s.name.trim());
    case "prices":
      return d.services.some((s) => s.name.trim() && s.price.trim());
    case "gallery":
      return d.gallery.length > 0;
    case "highlights":
      return d.highlights.some((h) => h.label.trim() && h.value.trim());
    case "testimonials":
      return d.testimonials.some((t) => t.name.trim() && t.text.trim());
    case "areas":
      return d.areas.some((a) => a.trim());
    case "emergency":
      return d.emergency.available24x7 || Boolean(d.emergency.phone.trim() || d.emergency.message.trim());
    case "booking":
      return bookingCta(d) !== null;
    case "faq":
      return d.faq.some((f) => f.question.trim() && f.answer.trim());
    case "hours":
      return d.hours.some((h) => h.isOpen);
    case "location":
      return Boolean(d.address.trim() || d.city.trim());
    case "contact":
      return Boolean(d.phone || d.whatsapp || d.email);
    case "social":
      return Object.values(d.socials).some((v) => v.trim());
    case "experience":
      return d.experience.some((e) => e.organization.trim() && e.role.trim());
    case "education":
      return d.education.some((e) => e.institution.trim());
    case "skills":
      return d.skills.some((s) => s.name.trim());
    case "projects":
      return d.projects.some((p) => p.title.trim());
    case "certifications":
      return d.certifications.some((c) => c.name.trim());
    case "delivery":
      return d.delivery.available;
    case "inquiry":
      return true;
    case "lead":
      return true;
  }
}

export function visibleSections(d: SiteData) {
  return d.sections.filter((s) => s.enabled && sectionHasContent(s.type, d));
}

/** Items grouped by their optional category, in first-appearance order. Ungrouped items come first, without a heading. */
export function groupItems(items: ServiceData[]): { title: string; items: ServiceData[] }[] {
  const groups = new Map<string, ServiceData[]>();
  for (const it of items) {
    const key = it.category.trim();
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  const ungrouped = groups.get("");
  groups.delete("");
  return [
    ...(ungrouped ? [{ title: "", items: ungrouped }] : []),
    ...[...groups].map(([title, list]) => ({ title, items: list })),
  ];
}

/** "70" -> "₪70". Text such as "מ-100 ₪" is left as the owner wrote it. */
export function formatPrice(price: string): string {
  const p = price.trim();
  return /^[\d.,\s-]+$/.test(p) ? `₪${p}` : p;
}
