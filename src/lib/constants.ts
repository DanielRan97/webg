export const WEBSITE_STATUS = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED" } as const;
export type WebsiteStatus = (typeof WEBSITE_STATUS)[keyof typeof WEBSITE_STATUS];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  TRIAL: "TRIAL",
} as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/** Product tier, independent of billing state (SUBSCRIPTION_STATUS) - which features a site's owner can use. */
export const PLAN = { BASIC: "BASIC", PRO: "PRO" } as const;
export type Plan = (typeof PLAN)[keyof typeof PLAN];

export const CTA_TYPES = {
  CALL: "CALL",
  WHATSAPP: "WHATSAPP",
  BOOKING: "BOOKING",
  MESSAGE: "MESSAGE",
} as const;
export type CtaType = (typeof CTA_TYPES)[keyof typeof CTA_TYPES];

export const CTA_OPTIONS: { value: CtaType; label: string; button: string }[] = [
  { value: "CALL", label: "התקשרו אליי", button: "התקשרו עכשיו" },
  { value: "WHATSAPP", label: "שלחו WhatsApp", button: "שלחו הודעה ב-WhatsApp" },
  { value: "BOOKING", label: "קבעו תור", button: "קבעו תור" },
  { value: "MESSAGE", label: "שלחו הודעה", button: "שלחו הודעה" },
];

export const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok", "linkedin", "github"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  github: "GitHub",
};

export const TEMPLATE_IDS = ["modern", "elegant", "minimal", "bold", "dark"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

/**
 * Which plan a template requires - pure data, kept here (not just in
 * templates/registry.ts) so server-side write paths can enforce it without
 * importing the template React components. Every template shipped so far is
 * "standard"; this is metadata-only until a real premium template exists.
 */
export const TEMPLATE_TIERS: Record<TemplateId, "standard" | "premium"> = {
  modern: "standard",
  elegant: "standard",
  minimal: "standard",
  bold: "standard",
  dark: "standard",
};

export const BOOKING_METHODS = ["WHATSAPP", "PHONE", "LINK"] as const;
export type BookingMethod = (typeof BOOKING_METHODS)[number];
export const BOOKING_LABELS: Record<BookingMethod, { label: string; hint: string }> = {
  WHATSAPP: { label: "בוואטסאפ", hint: "הלקוח שולח לכם הודעה מוכנה" },
  PHONE: { label: "בטלפון", hint: "הלקוח מתקשר אליכם" },
  LINK: { label: "בקישור", hint: "למשל יומן תורים אונליין" },
};

/** A customer-initiated event from a website's public pages, recorded in CustomerInteraction. BOOKING/CALLBACK exist for future native forms - nothing produces them yet, see src/server/interactions.ts. */
export const INTERACTION_TYPES = {
  CONTACT_MESSAGE: "CONTACT_MESSAGE",
  LEAD: "LEAD",
  BOOKING: "BOOKING",
  CALLBACK: "CALLBACK",
  OTHER: "OTHER",
} as const;
export type InteractionType = (typeof INTERACTION_TYPES)[keyof typeof INTERACTION_TYPES];

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  CONTACT_MESSAGE: "הודעה",
  LEAD: "ליד",
  BOOKING: "קביעת תור",
  CALLBACK: "בקשה לחזרה",
  OTHER: "פנייה",
};

/**
 * The independent, self-contained pieces a wizard draft autosave can touch -
 * one per wizard step. Autosave sends only the domains that actually changed
 * since the last successful save, so typing a business name never rewrites
 * services, testimonials, sections, etc. Server-side, this is also the
 * whitelist an incoming autosave request's `domains` are validated against -
 * see `autosaveWebsiteDraft` in src/server/websites.ts. "address" (the
 * slug) is handled there in its own validated branch, not the generic
 * column-picker, since it needs format + uniqueness checks, not a plain copy.
 */
export const AUTOSAVE_DOMAINS = [
  "basics", "branding", "hours", "sections", "services", "testimonials", "areas",
  "delivery", "emergency", "booking", "faq", "highlights", "experience", "education",
  "skills", "projects", "certifications", "images", "social", "address",
] as const;
export type AutosaveDomain = (typeof AUTOSAVE_DOMAINS)[number];

/** Purpose of a row in VerificationToken - keeps password-reset and email-verify tokens in one table without mixing them up. */
export const TOKEN_PURPOSE = {
  PASSWORD_RESET: "PASSWORD_RESET",
  EMAIL_VERIFY: "EMAIL_VERIFY",
} as const;
export type TokenPurpose = (typeof TOKEN_PURPOSE)[keyof typeof TOKEN_PURPOSE];
