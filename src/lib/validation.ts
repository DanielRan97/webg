import { z } from "zod";
import { BOOKING_METHODS, CTA_TYPES, SOCIAL_PLATFORMS, TEMPLATE_IDS } from "./constants";
import { ALL_SECTIONS } from "./sections";

const text = (max: number) => z.string().trim().max(max);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal(""));
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

/**
 * Only our own uploaded images are accepted: either the local dev route
 * (`/api/files/<name>`) or an absolute URL under our R2 public bucket
 * origin. This stops anyone from pasting an arbitrary external URL into a
 * "logo" field, which would otherwise let a site hot-link or reference
 * unrelated (and unmoderated) content as if it were an upload.
 */
const imageUrl = z.string().superRefine((v, ctx) => {
  if (v === "") return;
  const okLocal = /^\/api\/files\/[a-zA-Z0-9-]+\.(png|jpg|jpeg|webp|gif)$/.test(v);
  const r2Base = process.env.R2_PUBLIC_URL;
  const okR2 = Boolean(r2Base) && v.startsWith(`${r2Base}/`) && /\.(png|jpg|jpeg|webp|gif)$/i.test(v);
  if (!okLocal && !okR2) ctx.addIssue({ code: "custom", message: "קובץ התמונה לא תקין" });
});

/** A bare link such as "calendly.com/daniel" or a full https:// URL - same laxness as the existing booking-link check. */
const looseUrl = (max: number) => text(max).refine((v) => v === "" || /^(https?:\/\/)?[^\s]+\.[^\s]+$/i.test(v), "הקישור לא נראה תקין");

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
  subtitle: text(80),

  phone: text(30),
  whatsapp: text(30),
  email: text(120).refine((v) => v === "" || z.email().safeParse(v).success, "כתובת האימייל לא תקינה"),
  address: text(120),
  city: text(60),
  ctaType: z.enum(Object.values(CTA_TYPES) as [string, ...string[]]),
  openSaturday: z.boolean(),
  openHolidays: z.boolean(),
  resumeUrl: looseUrl(300),

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
  gallery: z
    .array(z.object({ url: imageUrl, title: text(80), description: text(300), price: text(30) }))
    .max(12),
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
  experience: z
    .array(z.object({ organization: text(100), role: text(100), startDate: text(30), endDate: text(30), description: text(400) }))
    .max(30),
  education: z
    .array(z.object({ institution: text(100), field: text(100), dates: text(40), description: text(400) }))
    .max(20),
  skills: z.array(z.object({ name: text(40) })).max(40),
  projects: z
    .array(z.object({ title: text(100), description: text(500), imageUrl, link: looseUrl(300) }))
    .max(30),
  certifications: z
    .array(z.object({ name: text(120), issuer: text(100), date: text(30), link: looseUrl(300) }))
    .max(30),
  sections: z
    .array(z.object({ type: z.enum(ALL_SECTIONS as [string, ...string[]]), enabled: z.boolean() }))
    .max(ALL_SECTIONS.length),
});

/** Trimmed, lowercased email, in one place so every entry point normalizes the same way (this is also what keeps one person from creating two accounts with "Name@Gmail.com" and "name@gmail.com"). */
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .refine((v) => z.email().safeParse(v).success, "כתובת האימייל לא תקינה");

/** Login only checks that *something* was typed - the real check is the password comparison. A stricter minimum here would lock out anyone whose existing password predates a policy change. */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "נא לכתוב סיסמה").max(200),
});

/** New passwords (signup, reset) must meet today's minimum. */
export const signupSchema = z.object({
  email: emailField,
  password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים").max(100),
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים").max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "הסיסמאות לא זהות", path: ["confirmPassword"] });
