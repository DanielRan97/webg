/** WEBG's public contact address (a Google Workspace alias). Public by design - shown in the UI and used as Reply-To - so it's a constant, not an env var. Transactional mail is still sent *from* EMAIL_FROM (no-reply@). */
export const SUPPORT_EMAIL = "hello@webg.co.il";

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

export const TEMPLATE_IDS = ["modern", "elegant", "minimal", "bold", "dark", "noble", "luxe"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

/**
 * Which plan a template requires - pure data, kept here (not just in
 * templates/registry.ts) so server-side write paths can enforce it without
 * importing the template React components.
 */
export const TEMPLATE_TIERS: Record<TemplateId, "standard" | "premium"> = {
  modern: "standard",
  elegant: "standard",
  minimal: "standard",
  bold: "standard",
  dark: "standard",
  noble: "premium",
  luxe: "premium",
};

/** What the services/menu list holds - drives its wording in the form and its title on the site. */
export const ITEM_KINDS = ["DISHES", "PRODUCTS", "SERVICES"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];
export const ITEM_KIND_LABELS: Record<ItemKind, { option: string; noun: string; plural: string; title: string }> = {
  DISHES: { option: "מנות", noun: "מנה", plural: "מנות", title: "תפריט" },
  PRODUCTS: { option: "מוצרים", noun: "מוצר", plural: "מוצרים", title: "המוצרים שלנו" },
  SERVICES: { option: "שירותים", noun: "שירות", plural: "שירותים", title: "השירותים שלנו" },
};

/** The form step's name when the list is shown only as the menu. */
export const menuStepLabel = (kind: ItemKind) => (kind === "DISHES" ? "תפריט" : (ITEM_KIND_LABELS[kind] ?? ITEM_KIND_LABELS.DISHES).option);

/** The service/delivery area that covers everywhere (see lib/places.ts). */
export const WHOLE_COUNTRY = "כל הארץ";

/** Common Israeli holidays offered as one-tap names for special opening hours (any other name can be typed). */
export const HOLIDAY_SUGGESTIONS = [
  "ערב ראש השנה", "ראש השנה", "ערב יום כיפור", "יום כיפור", "ערב סוכות", "סוכות", "חול המועד סוכות", "שמחת תורה",
  "חנוכה", "פורים", "ערב פסח", "פסח", "חול המועד פסח", "שביעי של פסח", "יום הזיכרון", "יום העצמאות", "ערב שבועות", "שבועות",
] as const;

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

export const SUPPORT_TICKET_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  CLOSED: "CLOSED",
} as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUS)[keyof typeof SUPPORT_TICKET_STATUS];

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: "פתוח",
  IN_PROGRESS: "בטיפול",
  CLOSED: "סגור",
};

/** "BILLING" is deliberately not offered yet - no real payment provider is connected, see src/app/support. */
export const SUPPORT_CATEGORY = {
  ISSUE: "ISSUE",
  QUESTION: "QUESTION",
  SUGGESTION: "SUGGESTION",
  ACCOUNT: "ACCOUNT",
  OTHER: "OTHER",
} as const;
export type SupportCategory = (typeof SUPPORT_CATEGORY)[keyof typeof SUPPORT_CATEGORY];

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  ISSUE: "תקלה",
  QUESTION: "שאלה",
  SUGGESTION: "הצעה",
  ACCOUNT: "חשבון",
  OTHER: "אחר",
};

/** Who wrote a given SupportMessage. */
export const SUPPORT_SENDER_TYPE = { USER: "USER", ADMIN: "ADMIN" } as const;
export type SupportSenderType = (typeof SUPPORT_SENDER_TYPE)[keyof typeof SUPPORT_SENDER_TYPE];
