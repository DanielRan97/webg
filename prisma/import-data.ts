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

  // createMany (one round trip per table) rather than one create() per row:
  // over a network connection (Neon), hundreds of sequential awaited round
  // trips inside a single interactive transaction can outrun Prisma's
  // default 5s transaction timeout well before all the data is written.
  await db.$transaction(
    async (tx) => {
      for (const u of dump.users) await tx.user.create({ data: u }); // one-off, needs to exist before children reference it
      if (dump.websites.length) await tx.website.createMany({ data: dump.websites });
      if (dump.profiles.length) await tx.businessProfile.createMany({ data: dump.profiles });
      if (dump.services.length) await tx.service.createMany({ data: dump.services });
      if (dump.hours.length) await tx.businessHour.createMany({ data: dump.hours });
      if (dump.gallery.length) await tx.galleryImage.createMany({ data: dump.gallery });
      if (dump.socials.length) await tx.socialLink.createMany({ data: dump.socials });
      if (dump.sections.length) await tx.websiteSection.createMany({ data: dump.sections });
      if (dump.subscriptions.length) await tx.subscription.createMany({ data: dump.subscriptions });
      if (dump.testimonials.length) await tx.testimonial.createMany({ data: dump.testimonials });
      if (dump.areas.length) await tx.serviceArea.createMany({ data: dump.areas });
      if (dump.faqItems.length) await tx.faqItem.createMany({ data: dump.faqItems });
      if (dump.highlights.length) await tx.highlight.createMany({ data: dump.highlights });
    },
    { timeout: 60_000, maxWait: 15_000 },
  );

  console.log(`Imported ${dump.users.length} user(s) and ${dump.websites.length} website(s) from ${file}.`);
  console.log("Everyone will need to log in again (sessions were not carried over) and reset their password if forgotten.");
  await db.$disconnect();
}
main();
