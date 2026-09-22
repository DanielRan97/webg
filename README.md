# WEBG - Web Generate

Fill in your business details, get a website. Hebrew / RTL-first SaaS for small businesses in Israel.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS 4 · Prisma · **PostgreSQL (Neon)** · database-backed sessions (`bcryptjs`) · Resend (email) · Cloudflare R2 (uploads, production).

## Quick start

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL / DIRECT_URL (see below); everything else has a dev fallback
npm run db:migrate          # applies migrations to whatever DATABASE_URL points at
npm run db:seed             # optional: demo user + 2 sample sites - do NOT run against a database with real users
npm run dev                 # http://localhost:3000
```

Demo login after seeding: `demo@webg.co.il` / `demo1234`
Sample public site: `/s/daniel-barber` (published). `cafe-hapina` is a draft.

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:reset` (wipes + reseeds - **never** run this against a database with real data).

### Local development database

The app now targets PostgreSQL everywhere, including local dev - there is no SQLite fallback. The simplest options: a free [Neon](https://neon.tech) or [Supabase](https://supabase.com) project (same as production, see below), or a local Postgres install / Docker container. Either way, set `DATABASE_URL` (and `DIRECT_URL` if your provider pools connections) in `.env`.

## How it works

- **One renderer.** `/s/[slug]` loads a website by slug and renders `<WebsiteRenderer template data />`. The wizard preview (`/preview` in an iframe), the owner preview and the public page all use it. Nothing is generated per business.
- **`SiteData`** (`src/types/site.ts`) is the single data contract between DB, forms and templates.
- **Sections** are defined once in `src/lib/sections.ts` (plain-Hebrew name and explanation) and rendered once in `src/templates/engine/Sections.tsx`. Hero, About, Services, Price list, Menu, Gallery, Highlights, Testimonials, Service areas, Emergency, Booking button, FAQ, Hours, Location, Contact and Social links. Every template supports every section.
- **Categories** (`src/lib/categories.ts`) only decide which sections are suggested, in what order, and which are on for a new site. All sections stay available to every business (under "more sections" in the editor), and the owner can show, hide or reorder any of them.
- **Templates** (Modern, Elegant, Minimal, Bold, Dark) live in `src/templates/<name>/`. A template is a theme (class strings for cards, buttons, typography, gallery layout...), a palette, a header and a hero; the page skeleton and all sections come from `src/templates/engine`. Colors reach the templates as CSS variables (`palette.ts`), which keeps text readable on any brand color.
  To add a template: create its config, register it in `src/templates/registry.ts`, and add its id to `TEMPLATE_IDS` in `src/lib/constants.ts`.
- **Section order** can be changed by dragging (`@dnd-kit`, works with mouse, touch and keyboard) or with the up/down buttons.
- **Visibility rule** (one place): `isPubliclyVisible()` in `src/lib/subscription.ts` - published AND subscription `ACTIVE` or `TRIAL`. When a subscription lapses nothing is deleted; the public page shows "unavailable" and the dashboard shows "האתר לא פעיל" with "הפעל מחדש".
- **Mock billing.** `activate/deactivateSubscriptionAction` (`src/server/actions/sites.ts`) flip `Subscription.status`. Real payments should call `setSubscriptionStatus()` from a webhook instead.
- **Uploads** go through an adapter (`src/lib/storage/`): local disk in dev, Cloudflare R2 in production (required whenever `NODE_ENV=production`, see `src/lib/env.ts`).

## Database: PostgreSQL (Neon)

The schema is deliberately provider-neutral (no enums, no `Json`, no native `@db.*` types - status fields are plain strings, see `src/lib/constants.ts`), but the app now targets PostgreSQL specifically, via [Neon](https://neon.tech). `DATABASE_URL` is Neon's **pooled** connection string (used by Prisma Client at runtime); `DIRECT_URL` is the **direct** connection string (used by Prisma Migrate). Both come from the Neon dashboard's Connection Details.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Applying migrations: `npm run db:migrate` locally, `npx prisma migrate deploy` in production/CI. Both use `DIRECT_URL` for the migration itself and never touch data outside the intended change.

**Setting up a new environment from scratch** (fresh Neon project, nothing on it yet): just `npx prisma migrate dev --name init`.

**Moving an existing database's data to a new one** (e.g. this project's original SQLite → Postgres cutover): use the export/import pair in `prisma/`, which preserve every row's original id so relations and public URLs (slugs) stay identical.
```bash
npx tsx prisma/export-data.ts                          # dumps the CURRENT database to prisma/backups/export-<timestamp>.json (read-only, safe anytime)
# point DATABASE_URL/DIRECT_URL at the new (empty) database, then:
npx prisma migrate dev --name init                      # creates the schema there
npx tsx prisma/import-data.ts prisma/backups/export-<timestamp>.json
```
Notes:
- `import-data.ts` refuses to run against a database that already has users, unless you pass `--force` - it is meant for a one-time cutover onto an empty database, not for merging or syncing.
- Sessions and one-time tokens are **not** carried over (they are short-lived by design); everyone needs to log in again after a cutover, and anyone mid-way through a password reset needs to request a new link. Passwords themselves (the `passwordHash` column) are copied exactly, so existing accounts log in with their existing password.
- Over a network connection, wrap the whole import in one transaction with a generous `timeout` (see `import-data.ts`) and prefer `createMany` over many individual `create()` calls - Prisma's interactive-transaction default (5s) is easy to exceed once there are hundreds of sequential round trips to a remote database.

Optional hardening once the schema has settled: convert the status strings to Prisma enums, add `@db.Text` to long text, and add a DB `CHECK` on `Website.status`.

## Roadmap

- **Phase 3:** payments, custom domains, analytics, AI copy, SEO tools.

## Existing websites and data compatibility

Phase 2 only **adds** things: new tables (testimonials, service areas, FAQ, highlights), new optional columns (menu/price group, emergency and booking settings), all with defaults. Sites saved before Phase 2 keep every value and every section exactly as it was; sections that did not exist yet are appended **switched off**, so nothing appears or disappears on a live site. Switching templates only changes `templateId`.

Migration: `npm run db:migrate` (or `npx prisma migrate deploy` in production).

`npm run db:seed` resets the `demo@webg.co.il` account and creates one published sample site per business type. Do not use that account for real work.
