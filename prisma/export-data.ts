/**
 * Stage 1 (PostgreSQL migration) — safety-net export.
 *
 * Dumps every row from the current database (whatever DATABASE_URL points
 * at) into a single JSON file. Read-only: never modifies or deletes
 * anything. Run this before switching providers, and keep the file
 * somewhere safe (it is git-ignored).
 *
 *   npx tsx prisma/export-data.ts
 *
 * Produces prisma/backups/export-<timestamp>.json. Import it into a fresh
 * database with prisma/import-data.ts (see README "Switching to PostgreSQL").
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";

async function main() {
  const [
    users,
    websites,
    profiles,
    services,
    hours,
    gallery,
    socials,
    sections,
    subscriptions,
    testimonials,
    areas,
    faqItems,
    highlights,
    sessions,
    tokens,
  ] = await Promise.all([
    db.user.findMany(),
    db.website.findMany(),
    db.businessProfile.findMany(),
    db.service.findMany(),
    db.businessHour.findMany(),
    db.galleryImage.findMany(),
    db.socialLink.findMany(),
    db.websiteSection.findMany(),
    db.subscription.findMany(),
    db.testimonial.findMany(),
    db.serviceArea.findMany(),
    db.faqItem.findMany(),
    db.highlight.findMany(),
    db.session.findMany(),
    db.verificationToken.findMany(),
  ]);

  const dump = {
    exportedAt: new Date().toISOString(),
    users,
    websites,
    profiles,
    services,
    hours,
    gallery,
    socials,
    sections,
    subscriptions,
    testimonials,
    areas,
    faqItems,
    highlights,
    // Sessions/tokens are short-lived and reference random secrets already
    // hashed at rest; there is no value in carrying them to a new database.
    // Recorded here only as a count, for visibility.
    sessionCount: sessions.length,
    tokenCount: tokens.length,
  };

  const dir = path.join(process.cwd(), "prisma", "backups");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(dump, null, 2));

  console.log(`Exported to ${file}`);
  console.log(
    `  users: ${users.length}, websites: ${websites.length}, services: ${services.length}, ` +
      `testimonials: ${testimonials.length}, gallery images: ${gallery.length}`,
  );
  await db.$disconnect();
}
main();
