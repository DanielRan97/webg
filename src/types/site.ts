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

/** One gallery photo. Title/description/price are all optional - an image with none of them behaves exactly like a plain photo. */
export interface GalleryImageData {
  url: string;
  title: string;
  description: string;
  price: string;
}

export interface ExperienceData {
  organization: string;
  role: string;
  startDate: string;
  /** Empty means "עד היום" (still there). */
  endDate: string;
  description: string;
}

export interface EducationData {
  institution: string;
  field: string;
  dates: string;
  description: string;
}

export interface SkillData {
  name: string;
}

/** A portfolio work sample. Deliberately has no price field. */
export interface ProjectData {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

export interface CertificationData {
  name: string;
  issuer: string;
  date: string;
  link: string;
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
  /** Short subtitle/role under the name in the hero, e.g. "מפתחת Full-Stack". Any category. */
  subtitle: string;

  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  ctaType: CtaType;
  openSaturday: boolean;
  openHolidays: boolean;
  /** Optional CV/resume download link (portfolio category). */
  resumeUrl: string;

  services: ServiceData[];
  hours: HourData[];
  gallery: GalleryImageData[];
  socials: Record<SocialPlatform, string>;
  testimonials: TestimonialData[];
  areas: string[];
  emergency: EmergencyData;
  booking: BookingData;
  faq: FaqData[];
  highlights: HighlightData[];
  experience: ExperienceData[];
  education: EducationData[];
  skills: SkillData[];
  projects: ProjectData[];
  certifications: CertificationData[];
  /** Display order = array order. Contains every section type; `enabled` says which are shown. */
  sections: SectionData[];
}
