import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SOCIAL_PLATFORMS, SUBSCRIPTION_STATUS, WEBSITE_STATUS, type CtaType, type SubscriptionStatus } from "@/lib/constants";
import { isSectionType } from "@/lib/sections";
import { isValidSlug, uniqueSlug } from "@/lib/slug";
import { defaultHours, emptySiteData, normalizeSections, withAllSections } from "@/lib/site-defaults";
import { removeUploadedImage } from "@/lib/storage";
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
  experience: { orderBy: { order: "asc" } },
  education: { orderBy: { order: "asc" } },
  skills: { orderBy: { order: "asc" } },
  projects: { orderBy: { order: "asc" } },
  certifications: { orderBy: { order: "asc" } },
} satisfies Prisma.WebsiteInclude;

type WebsiteRow = Prisma.WebsiteGetPayload<{ include: typeof include }>;

export interface WebsiteRecord {
  id: string;
  userId: string;
  slug: string;
  status: string;
  subscriptionStatus: string;
  /** Non-null while still mid-wizard (holds the last-visited step id); null once the wizard has been completed. */
  wizardStep: string | null;
  updatedAt: Date;
  data: SiteData;
}

function toRecord(row: WebsiteRow): WebsiteRecord {
  const socials = { instagram: "", facebook: "", tiktok: "", linkedin: "", github: "" };
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
    wizardStep: row.wizardStep,
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
      subtitle: p?.subtitle ?? "",
      phone: p?.phone ?? "",
      whatsapp: p?.whatsapp ?? "",
      email: p?.email ?? "",
      address: p?.address ?? "",
      city: p?.city ?? "",
      ctaType: (p?.ctaType ?? "WHATSAPP") as CtaType,
      openSaturday: p?.openSaturday ?? false,
      openHolidays: p?.openHolidays ?? false,
      resumeUrl: p?.resumeUrl ?? "",
      services: row.services.map((s) => ({
        name: s.name,
        description: s.description ?? "",
        price: s.price ?? "",
        category: s.category ?? "",
      })),
      hours,
      gallery: row.gallery.map((g) => ({ url: g.url, title: g.title ?? "", description: g.description ?? "", price: g.price ?? "" })),
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
      delivery: {
        available: p?.deliveryAvailable ?? false,
        areas: p?.deliveryAreas ?? "",
        minOrder: p?.deliveryMinOrder ?? "",
        fee: p?.deliveryFee ?? "",
        freeOver: p?.deliveryFreeOver ?? "",
        time: p?.deliveryTime ?? "",
        note: p?.deliveryNote ?? "",
      },
      faq: row.faqItems.map((f) => ({ question: f.question, answer: f.answer })),
      highlights: row.highlights.map((h) => ({ label: h.label, value: h.value })),
      experience: row.experience.map((e) => ({
        organization: e.organization, role: e.role,
        startDate: e.startDate ?? "", endDate: e.endDate ?? "", description: e.description ?? "",
      })),
      education: row.education.map((e) => ({
        institution: e.institution, field: e.field ?? "", dates: e.dates ?? "", description: e.description ?? "",
      })),
      skills: row.skills.map((s) => ({ name: s.name })),
      projects: row.projects.map((p) => ({
        title: p.title, description: p.description ?? "", imageUrl: p.imageUrl ?? "", link: p.link ?? "",
      })),
      certifications: row.certifications.map((c) => ({
        name: c.name, issuer: c.issuer ?? "", date: c.date ?? "", link: c.link ?? "",
      })),
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
    tx.experience.deleteMany({ where: { websiteId } }),
    tx.education.deleteMany({ where: { websiteId } }),
    tx.skill.deleteMany({ where: { websiteId } }),
    tx.project.deleteMany({ where: { websiteId } }),
    tx.certification.deleteMany({ where: { websiteId } }),
  ]);

  const services = d.services.filter((s) => s.name.trim());
  // Independent tables, no ordering dependency between them - run as one
  // batch of round-trips instead of sequentially, for the same reason the
  // deletes above already run in parallel.
  await Promise.all([
    tx.service.createMany({
      data: services.map((s, order) => ({
        websiteId, order, name: s.name.trim(),
        description: s.description.trim() || null,
        price: s.price.trim() || null,
        category: s.category.trim() || null,
      })),
    }),
    tx.testimonial.createMany({
      data: d.testimonials
        .filter((t) => t.name.trim() && t.text.trim())
        .map((t, order) => ({
          websiteId, order, name: t.name.trim(), text: t.text.trim(),
          rating: t.rating >= 1 && t.rating <= 5 ? t.rating : null,
          imageUrl: t.imageUrl || null,
        })),
    }),
    tx.serviceArea.createMany({
      data: d.areas.map((a) => a.trim()).filter(Boolean).map((name, order) => ({ websiteId, order, name })),
    }),
    tx.faqItem.createMany({
      data: d.faq
        .filter((f) => f.question.trim() && f.answer.trim())
        .map((f, order) => ({ websiteId, order, question: f.question.trim(), answer: f.answer.trim() })),
    }),
    tx.highlight.createMany({
      data: d.highlights
        .filter((h) => h.label.trim() && h.value.trim())
        .map((h, order) => ({ websiteId, order, label: h.label.trim(), value: h.value.trim() })),
    }),
    tx.businessHour.createMany({
      data: d.hours.map((h) => ({
        websiteId, day: h.day, isOpen: h.isOpen,
        openTime: h.isOpen ? h.openTime || null : null,
        closeTime: h.isOpen ? h.closeTime || null : null,
      })),
    }),
    tx.galleryImage.createMany({
      data: d.gallery.map((g, order) => ({
        websiteId, order, url: g.url,
        title: g.title.trim() || null,
        description: g.description.trim() || null,
        price: g.price.trim() || null,
      })),
    }),
    tx.socialLink.createMany({
      data: SOCIAL_PLATFORMS.filter((p) => d.socials[p].trim()).map((p) => ({
        websiteId, platform: p, url: d.socials[p].trim(),
      })),
    }),
    tx.websiteSection.createMany({
      data: normalizeSections(d.sections).map((s, order) => ({ websiteId, type: s.type, enabled: s.enabled, order })),
    }),
    tx.experience.createMany({
      data: d.experience
        .filter((e) => e.organization.trim() && e.role.trim())
        .map((e, order) => ({
          websiteId, order, organization: e.organization.trim(), role: e.role.trim(),
          startDate: e.startDate.trim() || null, endDate: e.endDate.trim() || null,
          description: e.description.trim() || null,
        })),
    }),
    tx.education.createMany({
      data: d.education
        .filter((e) => e.institution.trim())
        .map((e, order) => ({
          websiteId, order, institution: e.institution.trim(),
          field: e.field.trim() || null, dates: e.dates.trim() || null, description: e.description.trim() || null,
        })),
    }),
    tx.skill.createMany({
      data: d.skills.map((s) => s.name.trim()).filter(Boolean).map((name, order) => ({ websiteId, order, name })),
    }),
    tx.project.createMany({
      data: d.projects
        .filter((p) => p.title.trim())
        .map((p, order) => ({
          websiteId, order, title: p.title.trim(),
          description: p.description.trim() || null, imageUrl: p.imageUrl || null, link: p.link.trim() || null,
        })),
    }),
    tx.certification.createMany({
      data: d.certifications
        .filter((c) => c.name.trim())
        .map((c, order) => ({
          websiteId, order, name: c.name.trim(),
          issuer: c.issuer.trim() || null, date: c.date.trim() || null, link: c.link.trim() || null,
        })),
    }),
  ]);
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
    subtitle: d.subtitle.trim() || null,
    resumeUrl: d.resumeUrl.trim() || null,
    emergency24x7: d.emergency.available24x7,
    emergencyPhone: d.emergency.phone.trim() || null,
    emergencyMessage: d.emergency.message.trim() || null,
    bookingMethod: d.booking.method,
    bookingUrl: d.booking.url.trim() || null,
    bookingText: d.booking.buttonText.trim() || null,
    deliveryAvailable: d.delivery.available,
    deliveryAreas: d.delivery.areas.trim() || null,
    deliveryMinOrder: d.delivery.minOrder.trim() || null,
    deliveryFee: d.delivery.fee.trim() || null,
    deliveryFreeOver: d.delivery.freeOver.trim() || null,
    deliveryTime: d.delivery.time.trim() || null,
    deliveryNote: d.delivery.note.trim() || null,
  };
}

export async function createWebsite(userId: string, d: SiteData, opts: { wizardStep?: string | null } = {}): Promise<WebsiteRecord> {
  const slug = await uniqueSlug(d.slug || d.businessName);
  // writeChildren does many sequential round-trips (one per child table); the
  // default 5s interactive-transaction timeout is comfortably exceeded over
  // real network latency once there are this many tables (see the identical
  // fix in prisma/import-data.ts for the same root cause).
  const id = await db.$transaction(async (tx) => {
    const site = await tx.website.create({
      data: {
        userId,
        slug,
        ...websiteColumns(d),
        status: WEBSITE_STATUS.DRAFT,
        subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
        wizardStep: opts.wizardStep ?? null,
        profile: { create: profileColumns(d) },
        subscription: { create: { status: SUBSCRIPTION_STATUS.TRIAL } },
      },
    });
    await writeChildren(tx, site.id, d);
    return site.id;
  }, { timeout: 20_000 });
  return (await getOwnedWebsite(userId, id))!;
}

/**
 * Creates an empty draft the instant a user starts the "create a new site"
 * wizard, so refreshing, closing the tab or logging back in later never
 * loses progress - the wizard then autosaves into this same row as the
 * owner fills it in. `wizardStep` starts at the first step id.
 */
export async function createDraftWebsite(userId: string): Promise<WebsiteRecord> {
  return createWebsite(userId, emptySiteData(), { wizardStep: "basics" });
}

export class SlugError extends Error {}

/**
 * Every image URL a site can reference, so we can tell which ones a save
 * just stopped using (and, on delete, which ones to remove entirely). Keep
 * this in sync whenever a new uploaded-image field is added anywhere in
 * SiteData - today that's the website's own logo/hero, gallery photos,
 * testimonial photos and portfolio project images.
 */
function collectImageUrls(d: SiteData): string[] {
  return [
    d.logoUrl,
    d.heroImageUrl,
    ...d.gallery.map((g) => g.url),
    ...d.testimonials.map((t) => t.imageUrl),
    ...d.projects.map((p) => p.imageUrl),
  ].filter((u): u is string => Boolean(u));
}

/**
 * Deletes each given URL from storage, but only after confirming no other
 * website row references that exact URL. Nothing about our editor lets a
 * user type an arbitrary URL into an image field (only our own uploader
 * sets them), so a collision is not expected in practice; this check is
 * the safety net that keeps a bug (or a delete) from ever removing
 * something still in use elsewhere. Failures here are logged and
 * swallowed - a missed cleanup wastes a little storage, it must never
 * fail the save/delete the user is waiting on.
 */
async function cleanupOrphanedImages(excludeWebsiteId: string, urls: string[]) {
  for (const url of [...new Set(urls)]) {
    try {
      const [onWebsite, inGallery, onTestimonial] = await Promise.all([
        db.website.count({ where: { id: { not: excludeWebsiteId }, OR: [{ logoUrl: url }, { heroImageUrl: url }] } }),
        db.galleryImage.count({ where: { url, websiteId: { not: excludeWebsiteId } } }),
        db.testimonial.count({ where: { imageUrl: url, websiteId: { not: excludeWebsiteId } } }),
      ]);
      if (onWebsite + inGallery + onTestimonial === 0) await removeUploadedImage(url);
    } catch (e) {
      console.error("image cleanup check failed (non-fatal):", e instanceof Error ? e.message : e);
    }
  }
}

/** Images a save just dropped (replaced logo, removed a gallery photo, ...). */
async function cleanupRemovedImages(websiteId: string, before: SiteData, after: SiteData) {
  const stillUsedHere = new Set(collectImageUrls(after));
  const dropped = collectImageUrls(before).filter((u) => !stillUsedHere.has(u));
  await cleanupOrphanedImages(websiteId, dropped);
}

export async function updateWebsite(
  userId: string,
  id: string,
  d: SiteData,
  opts: { wizardStep?: string | null } = {},
): Promise<WebsiteRecord | null> {
  const before = await getOwnedWebsite(userId, id);
  if (!before) return null;

  let slug = before.slug;
  const wanted = d.slug.trim().toLowerCase();
  if (wanted && wanted !== before.slug) {
    if (!isValidSlug(wanted)) throw new SlugError("הכתובת יכולה להכיל אותיות באנגלית, מספרים ומקפים בלבד (לפחות 3 תווים)");
    const taken = await db.website.findUnique({ where: { slug: wanted }, select: { id: true } });
    if (taken && taken.id !== id) throw new SlugError("הכתובת הזאת כבר תפוסה, נסו כתובת אחרת");
    slug = wanted;
  }

  await db.$transaction(async (tx) => {
    // `wizardStep: undefined` is Prisma's own "leave this column alone" convention -
    // callers outside the wizard (e.g. a normal edit-mode save) omit `opts.wizardStep`
    // entirely and never touch it either way.
    await tx.website.update({ where: { id }, data: { slug, ...websiteColumns(d), wizardStep: opts.wizardStep } });
    await tx.businessProfile.upsert({
      where: { websiteId: id },
      create: { websiteId: id, ...profileColumns(d) },
      update: profileColumns(d),
    });
    await writeChildren(tx, id, d);
  }, { timeout: 20_000 });
  const after = await getOwnedWebsite(userId, id);
  if (after) await cleanupRemovedImages(id, before.data, after.data);
  return after;
}

export async function setWebsiteStatus(userId: string, id: string, status: string) {
  const { count } = await db.website.updateMany({ where: { id, userId }, data: { status } });
  return count > 0;
}

/**
 * Permanently deletes a website: the row, every child record (cascade,
 * enforced at the DB level - see the `onDelete: Cascade` relations in
 * schema.prisma, nothing here deletes children manually), and any of its
 * images that no other website still references. Scoped by `{ id, userId }`
 * so this can never touch a site owned by someone else. Returns the site's
 * slug (for the caller to revalidate the now-gone public page), or null if
 * no matching site was found.
 */
export async function deleteWebsite(userId: string, id: string): Promise<string | null> {
  const before = await getOwnedWebsite(userId, id);
  if (!before) return null;

  const urls = collectImageUrls(before.data);

  // Extension point for real payments: once a subscription provider exists,
  // cancel/terminate it here (reading Subscription.provider/providerRef for
  // this website) before the row - and its Subscription - are gone. This
  // function is the single place a site is ever deleted from, so it is the
  // one place that future step needs to be added.
  const { count } = await db.website.deleteMany({ where: { id, userId } });
  if (count === 0) return null;

  await cleanupOrphanedImages(id, urls);
  return before.slug;
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
