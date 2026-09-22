import { z } from "zod";
import { BOOKING_METHODS, CTA_TYPES, SOCIAL_PLATFORMS, TEMPLATE_IDS } from "./constants";
import { ALL_SECTIONS } from "./sections";

const text = (max: number) => z.string().trim().max(max);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal(""));
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
/** Only our own upload URLs are accepted for images. */
const imageUrl = z.string().regex(/^\/api\/files\/[a-zA-Z0-9-]+\.(png|jpg|jpeg|webp|gif)$/).or(z.literal(""));

export const siteSchema = z.object({
  businessName: text(80).min(2, "נא למלא את שם העסק"),
  slug: text(40),
  category: text(30).min(1),
  description: text(600),
  primaryColor: hex,
  secondaryColor: hex.or(z.literal("")),
  logoUrl: imageUrl,
  heroImageUrl: imageUrl,
  templateId: z.enum(TEMPLATE_IDS),

  phone: text(30),
  whatsapp: text(30),
  email: text(120).refine((v) => v === "" || z.email().safeParse(v).success, "כתובת האימייל לא תקינה"),
  address: text(120),
  city: text(60),
  ctaType: z.enum(Object.values(CTA_TYPES) as [string, ...string[]]),
  openSaturday: z.boolean(),
  openHolidays: z.boolean(),

  services: z
    .array(z.object({ name: text(80), description: text(300), price: text(30), category: text(40) }))
    .max(60),
  hours: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        isOpen: z.boolean(),
        openTime: time,
        closeTime: time,
      }),
    )
    .max(7),
  gallery: z.array(imageUrl).max(12),
  socials: z.object(
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, text(200)])) as Record<
      (typeof SOCIAL_PLATFORMS)[number],
      z.ZodString
    >,
  ),
  testimonials: z
    .array(z.object({ name: text(60), text: text(500), rating: z.number().int().min(0).max(5), imageUrl }))
    .max(20),
  areas: z.array(text(40)).max(60),
  emergency: z.object({ available24x7: z.boolean(), phone: text(30), message: text(200) }),
  booking: z.object({
    method: z.enum(BOOKING_METHODS),
    url: text(300).refine((v) => v === "" || /^(https?:\/\/)?[^\s]+\.[^\s]+$/i.test(v), "הקישור לא נראה תקין"),
    buttonText: text(30),
  }),
  faq: z.array(z.object({ question: text(200), answer: text(800) })).max(30),
  highlights: z.array(z.object({ label: text(40), value: text(30) })).max(8),
  sections: z
    .array(z.object({ type: z.enum(ALL_SECTIONS as [string, ...string[]]), enabled: z.boolean() }))
    .max(20),
});

export const credentialsSchema = z.object({
  email: z.email("כתובת האימייל לא תקינה").max(120),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים").max(100),
});
