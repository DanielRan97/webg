/**
 * Stage 1 (PostgreSQL migration) — imports a JSON file produced by
 * export-data.ts into whichever database DATABASE_URL currently points at.
 * Run this against a FRESH database that already has the schema applied
 * (`npx prisma migrate dev --name init`), before anyone has signed up on it.
 *
 *   npx tsx prisma/import-data.ts prisma/backups/export-<timestamp>.json
 *
 * Preserves original IDs, so relations and public URLs (slugs) stay
 * identical. Safe to re-run against an empty database; refuses to run
 * against one that already has users, to avoid duplicating or colliding
 * with data (pass --force to override).
 */
import { readFileSync } from "node:fs";
import { db } from "../src/lib/db";

async function main() {
  const file = process.argv[2];
  const force = process.argv.includes("--force");
  if (!file) {
    console.error("Usage: npx tsx prisma/import-data.ts <export-file.json> [--force]");
    process.exit(1);
  }

  const existing = await db.user.count();
  if (existing > 0 && !force) {
    console.error(`Refusing to import: this database already has ${existing} user(s). Pass --force to import anyway.`);
    process.exit(1);
  }

  const dump = JSON.parse(readFileSync(file, "utf8"));

  await db.$transaction(async (tx) => {
    for (const u of dump.users) await tx.user.create({ data: u });
    for (const w of dump.websites) await tx.website.create({ data: w });
    for (const p of dump.profiles) await tx.businessProfile.create({ data: p });
    for (const s of dump.services) await tx.service.create({ data: s });
    for (const h of dump.hours) await tx.businessHour.create({ data: h });
    for (const g of dump.gallery) await tx.galleryImage.create({ data: g });
    for (const s of dump.socials) await tx.socialLink.create({ data: s });
    for (const s of dump.sections) await tx.websiteSection.create({ data: s });
    for (const s of dump.subscriptions) await tx.subscription.create({ data: s });
    for (const t of dump.testimonials) await tx.testimonial.create({ data: t });
    for (const a of dump.areas) await tx.serviceArea.create({ data: a });
    for (const f of dump.faqItems) await tx.faqItem.create({ data: f });
    for (const h of dump.highlights) await tx.highlight.create({ data: h });
  });

  console.log(`Imported ${dump.users.length} user(s) and ${dump.websites.length} website(s) from ${file}.`);
  console.log("Everyone will need to log in again (sessions were not carried over) and reset their password if forgotten.");
  await db.$disconnect();
}
main();
