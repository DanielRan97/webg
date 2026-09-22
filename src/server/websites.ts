import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SOCIAL_PLATFORMS, SUBSCRIPTION_STATUS, WEBSITE_STATUS, type CtaType, type SubscriptionStatus } from "@/lib/constants";
import { isSectionType } from "@/lib/sections";
import { isValidSlug, uniqueSlug } from "@/lib/slug";
import { defaultHours, normalizeSections, withAllSections } from "@/lib/site-defaults";
import type { BookingMethod } from "@/lib/constants";
import type { SiteData } from "@/types/site";

const include = {
  profile: true,
  services: { orderBy: { order: "asc" } },
  hours: { orderBy: { day: "asc" } },
  gallery: { orderBy: { order: "asc" } },
  socials: true,
  sections: { orderBy: { order: "asc" } },
  testimonials: { orderBy: { order: "asc" } },
  areas: { orderBy: { order: "asc" } },
  faqItems: { orderBy: { order: "asc" } },
  highlights: { orderBy: { order: "asc" } },
} satisfies Prisma.WebsiteInclude;

type WebsiteRow = Prisma.WebsiteGetPayload<{ include: typeof include }>;

export interface WebsiteRecord {
  id: string;
  userId: string;
  slug: string;
  status: string;
  subscriptionStatus: string;
  updatedAt: Date;
  data: SiteData;
}

function toRecord(row: WebsiteRow): WebsiteRecord {
  const socials = { instagram: "", facebook: "", tiktok: "" };
  for (const s of row.socials) {
    if ((SOCIAL_PLATFORMS as readonly string[]).includes(s.platform)) {
      socials[s.platform as keyof typeof socials] = s.url;
    }
  }
  const hours = defaultHours().map((d) => {
    const saved = row.hours.find((h) => h.day === d.day);
    return saved
      ? { day: d.day, isOpen: saved.isOpen, openTime: saved.openTime ?? "", closeTime: saved.closeTime ?? "" }
      : d;
  });
  const p = row.profile;
  return {
    id: row.id,
    userId: row.userId,
    slug: row.slug,
    status: row.status,
    subscriptionStatus: row.subscriptionStatus,
    updatedAt: row.updatedAt,
    data: {
      businessName: row.businessName,
      slug: row.slug,
      category: row.category,
      description: row.description ?? "",
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor ?? "",
      logoUrl: row.logoUrl ?? "",
      heroImageUrl: row.heroImageUrl ?? "",
      templateId: row.templateId,
      phone: p?.phone ?? "",
      whatsapp: p?.whatsapp ?? "",
      email: p?.email ?? "",
      address: p?.address ?? "",
      city: p?.city ?? "",
      ctaType: (p?.ctaType ?? "WHATSAPP") as CtaType,
      openSaturday: p?.openSaturday ?? false,
      openHolidays: p?.openHolidays ?? false,
      services: row.services.map((s) => ({
        name: s.name,
        description: s.description ?? "",
        price: s.price ?? "",
        category: s.category ?? "",
      })),
      hours,
      gallery: row.gallery.map((g) => g.url),
      socials,
      testimonials: row.testimonials.map((t) => ({ name: t.name, text: t.text, rating: t.rating ?? 0, imageUrl: t.imageUrl ?? "" })),
      areas: row.areas.map((a) => a.name),
      emergency: {
        available24x7: p?.emergency24x7 ?? false,
        phone: p?.emergencyPhone ?? "",
        message: p?.emergencyMessage ?? "",
      },
      booking: {
        method: (["WHATSAPP", "PHONE", "LINK"].includes(p?.bookingMethod ?? "") ? p!.bookingMethod : "WHATSAPP") as BookingMethod,
        url: p?.bookingUrl ?? "",
        buttonText: p?.bookingText ?? "",
      },
      faq: row.faqItems.map((f) => ({ question: f.question, answer: f.answer })),
      highlights: row.highlights.map((h) => ({ label: h.label, value: h.value })),
      // Sites saved before newer sections existed get them appended, switched off.
      sections: withAllSections(
        row.sections
          .filter((s) => isSectionType(s.type))
          .map((s) => ({ type: s.type as SiteData["sections"][number]["type"], enabled: s.enabled })),
      ),
    },
  };
}

export async function getWebsiteBySlug(slug: string) {
  const row = await db.website.findUnique({ where: { slug }, include });
  return row ? toRecord(row) : null;
}

/** Returns the website only if it belongs to the user. */
export async function getOwnedWebsite(userId: string, id: string) {
  const row = await db.website.findFirst({ where: { id, userId }, include });
  return row ? toRecord(row) : null;
}

export async function listWebsites(userId: string) {
  const rows = await db.website.findMany({ where: { userId }, include, orderBy: { updatedAt: "desc" } });
  return rows.map(toRecord);
}

/** Writes all owned child records for a website. Runs inside the caller's transaction. */
async function writeChildren(tx: Prisma.TransactionClient, websiteId: string, d: SiteData) {
  await Promise.all([
    tx.service.deleteMany({ where: { websiteId } }),
    tx.businessHour.deleteMany({ where: { websiteId } }),
    tx.galleryImage.deleteMany({ where: { websiteId } }),
    tx.socialLink.deleteMany({ where: { websiteId } }),
    tx.websiteSection.deleteMany({ where: { websiteId } }),
    tx.testimonial.deleteMany({ where: { websiteId } }),
    tx.serviceArea.deleteMany({ where: { websiteId } }),
    tx.faqItem.deleteMany({ where: { websiteId } }),
    tx.highlight.deleteMany({ where: { websiteId } }),
  ]);

  const services = d.services.filter((s) => s.name.trim());
  await tx.service.createMany({
    data: services.map((s, order) => ({
      websiteId, order, name: s.name.trim(),
      description: s.description.trim() || null,
      price: s.price.trim() || null,
      category: s.category.trim() || null,
    })),
  });
  await tx.testimonial.createMany({
    data: d.testimonials
      .filter((t) => t.name.trim() && t.text.trim())
      .map((t, order) => ({
        websiteId, order, name: t.name.trim(), text: t.text.trim(),
        rating: t.rating >= 1 && t.rating <= 5 ? t.rating : null,
        imageUrl: t.imageUrl || null,
      })),
  });
  await tx.serviceArea.createMany({
    data: d.areas.map((a) => a.trim()).filter(Boolean).map((name, order) => ({ websiteId, order, name })),
  });
  await tx.faqItem.createMany({
    data: d.faq
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f, order) => ({ websiteId, order, question: f.question.trim(), answer: f.answer.trim() })),
  });
  await tx.highlight.createMany({
    data: d.highlights
      .filter((h) => h.label.trim() && h.value.trim())
      .map((h, order) => ({ websiteId, order, label: h.label.trim(), value: h.value.trim() })),
  });
  await tx.businessHour.createMany({
    data: d.hours.map((h) => ({
      websiteId, day: h.day, isOpen: h.isOpen,
      openTime: h.isOpen ? h.openTime || null : null,
      closeTime: h.isOpen ? h.closeTime || null : null,
    })),
  });
  await tx.galleryImage.createMany({ data: d.gallery.map((url, order) => ({ websiteId, url, order })) });
  await tx.socialLink.createMany({
    data: SOCIAL_PLATFORMS.filter((p) => d.socials[p].trim()).map((p) => ({
      websiteId, platform: p, url: d.socials[p].trim(),
    })),
  });
  await tx.websiteSection.createMany({
    data: normalizeSections(d.sections).map((s, order) => ({ websiteId, type: s.type, enabled: s.enabled, order })),
  });
}

function websiteColumns(d: SiteData) {
  return {
    businessName: d.businessName.trim(),
    category: d.category,
    description: d.description.trim() || null,
    primaryColor: d.primaryColor,
    secondaryColor: d.secondaryColor || null,
    logoUrl: d.logoUrl || null,
    heroImageUrl: d.heroImageUrl || null,
    templateId: d.templateId,
  };
}

function profileColumns(d: SiteData) {
  return {
    phone: d.phone.trim() || null,
    whatsapp: d.whatsapp.trim() || null,
    email: d.email.trim() || null,
    address: d.address.trim() || null,
    city: d.city.trim() || null,
    ctaType: d.ctaType,
    openSaturday: d.openSaturday,
    openHolidays: d.openHolidays,
    emergency24x7: d.emergency.available24x7,
    emergencyPhone: d.emergency.phone.trim() || null,
    emergencyMessage: d.emergency.message.trim() || null,
    bookingMethod: d.booking.method,
    bookingUrl: d.booking.url.trim() || null,
    bookingText: d.booking.buttonText.trim() || null,
  };
}

export async function createWebsite(userId: string, d: SiteData): Promise<WebsiteRecord> {
  const slug = await uniqueSlug(d.slug || d.businessName);
  const id = await db.$transaction(async (tx) => {
    const site = await tx.website.create({
      data: {
        userId,
        slug,
        ...websiteColumns(d),
        status: WEBSITE_STATUS.DRAFT,
        subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
        profile: { create: profileColumns(d) },
        subscription: { create: { status: SUBSCRIPTION_STATUS.TRIAL } },
      },
    });
    await writeChildren(tx, site.id, d);
    return site.id;
  });
  return (await getOwnedWebsite(userId, id))!;
}

export class SlugError extends Error {}

export async function updateWebsite(userId: string, id: string, d: SiteData): Promise<WebsiteRecord | null> {
  const current = await db.website.findFirst({ where: { id, userId }, select: { slug: true } });
  if (!current) return null;

  let slug = current.slug;
  const wanted = d.slug.trim().toLowerCase();
  if (wanted && wanted !== current.slug) {
    if (!isValidSlug(wanted)) throw new SlugError("הכתובת יכולה להכיל אותיות באנגלית, מספרים ומקפים בלבד (לפחות 3 תווים)");
    const taken = await db.website.findUnique({ where: { slug: wanted }, select: { id: true } });
    if (taken && taken.id !== id) throw new SlugError("הכתובת הזאת כבר תפוסה, נסו כתובת אחרת");
    slug = wanted;
  }

  await db.$transaction(async (tx) => {
    await tx.website.update({ where: { id }, data: { slug, ...websiteColumns(d) } });
    await tx.businessProfile.upsert({
      where: { websiteId: id },
      create: { websiteId: id, ...profileColumns(d) },
      update: profileColumns(d),
    });
    await writeChildren(tx, id, d);
  });
  return getOwnedWebsite(userId, id);
}

export async function setWebsiteStatus(userId: string, id: string, status: string) {
  const { count } = await db.website.updateMany({ where: { id, userId }, data: { status } });
  return count > 0;
}

/** Mock billing: flips Subscription.status and its Website cache together. Nothing is ever deleted. */
export async function setSubscriptionStatus(userId: string, id: string, status: SubscriptionStatus) {
  const site = await db.website.findFirst({ where: { id, userId }, select: { id: true } });
  if (!site) return false;
  await db.$transaction([
    db.subscription.upsert({
      where: { websiteId: id },
      create: { websiteId: id, status },
      update: { status },
    }),
    db.website.update({ where: { id }, data: { subscriptionStatus: status } }),
  ]);
  return true;
}
