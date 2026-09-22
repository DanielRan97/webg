import type { BookingMethod, CtaType, SocialPlatform } from "@/lib/constants";
import type { SectionType } from "@/lib/sections";

/** One entry in the menu, price list or services list. `category` is an optional group name. */
export interface ServiceData {
  name: string;
  description: string;
  price: string;
  category: string;
}

export interface HourData {
  day: number; // 0 = Sunday ... 6 = Saturday
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface SectionData {
  type: SectionType;
  enabled: boolean;
}

export interface TestimonialData {
  name: string;
  text: string;
  /** 0 = no rating, otherwise 1-5. */
  rating: number;
  imageUrl: string;
}

export interface FaqData {
  question: string;
  answer: string;
}

/** A simple "label + value" card, e.g. "שנות ניסיון" / "9". The owner chooses both. */
export interface HighlightData {
  label: string;
  value: string;
}

export interface EmergencyData {
  available24x7: boolean;
  phone: string;
  message: string;
}

export interface BookingData {
  method: BookingMethod;
  url: string;
  buttonText: string;
}

/**
 * Everything a template needs to render a business website.
 * Plain, serializable, and shared by the DB layer, the wizard/editor, the
 * live preview and the public page. Optional text is "" (never null).
 */
export interface SiteData {
  businessName: string;
  slug: string;
  category: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  heroImageUrl: string;
  templateId: string;

  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  ctaType: CtaType;
  openSaturday: boolean;
  openHolidays: boolean;

  services: ServiceData[];
  hours: HourData[];
  gallery: string[];
  socials: Record<SocialPlatform, string>;
  testimonials: TestimonialData[];
  areas: string[];
  emergency: EmergencyData;
  booking: BookingData;
  faq: FaqData[];
  highlights: HighlightData[];
  /** Display order = array order. Contains every section type; `enabled` says which are shown. */
  sections: SectionData[];
}
