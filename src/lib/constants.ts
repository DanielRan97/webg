export const WEBSITE_STATUS = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED" } as const;
export type WebsiteStatus = (typeof WEBSITE_STATUS)[keyof typeof WEBSITE_STATUS];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  TRIAL: "TRIAL",
} as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

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

export const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export const TEMPLATE_IDS = ["modern", "elegant", "minimal", "bold", "dark"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const BOOKING_METHODS = ["WHATSAPP", "PHONE", "LINK"] as const;
export type BookingMethod = (typeof BOOKING_METHODS)[number];
export const BOOKING_LABELS: Record<BookingMethod, { label: string; hint: string }> = {
  WHATSAPP: { label: "בוואטסאפ", hint: "הלקוח שולח לכם הודעה מוכנה" },
  PHONE: { label: "בטלפון", hint: "הלקוח מתקשר אליכם" },
  LINK: { label: "בקישור", hint: "למשל יומן תורים אונליין" },
};

/** Purpose of a row in VerificationToken - keeps password-reset and email-verify tokens in one table without mixing them up. */
export const TOKEN_PURPOSE = {
  PASSWORD_RESET: "PASSWORD_RESET",
  EMAIL_VERIFY: "EMAIL_VERIFY",
} as const;
export type TokenPurpose = (typeof TOKEN_PURPOSE)[keyof typeof TOKEN_PURPOSE];
