# WEBG - Web Generate

Fill in your business details, get a website. Hebrew / RTL-first SaaS for small businesses in Israel.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS 4 · Prisma · **PostgreSQL (Neon)** · database-backed sessions (`bcryptjs`) · Resend (email) · Cloudflare R2 (uploads, production).

## Quick start

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL / DIRECT_URL (see below); everything else has a dev fallback
npm run db:migrate          # applies migrations to whatever DATABASE_URL points at
npm run dev                 # http://localhost:3000
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:reset` (wipes the database - **never** run this against a database with real data).

### Tests

- `npm test` - unit tests (Vitest, `tests/unit`): field formats, site validation, plans, header layout, dates and the Global SMS client. No server, database or network; takes under a second.
- `npm run test:e2e` - end-to-end smoke tests (Playwright, `tests/e2e`) in desktop Chrome and a phone-sized one: sign up, log in/out, build a site in the wizard, verify its email, publish on Basic, see the public page and send it a message; plus the guards (login required, no publishing with an unverified email, another account gets a 404). They start their own dev server on port 3001 with email and SMS keys blanked, so nothing is really sent. First run: `npx playwright install chromium`.
  They write to the database in `.env` and **refuse to run unless it is the Neon `dev` branch**. Test accounts use `@e2e.webg.test` and are deleted before and after every run, together with the tests' rate-limit counters. A full run takes about 6 minutes, mostly dev-mode compiling.

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
- **Billing** (`src/server/billing.ts`, gateways in `src/lib/payments`): HYP Pay. The first payment goes through HYP's payment page (verified server-side on return at `/api/billing/return`) and leaves a card token; WEBG charges it monthly from a daily Vercel Cron job (`/api/cron/billing`). A failed charge makes the site `PAST_DUE` (still shown, owner emailed, retried on days 3 and 7); after 7 days it's `INACTIVE` (hidden, nothing deleted). Owners cancel on `/sites/[id]/billing`. Sites published before billing have no period, so the daily job ignores them until an admin presses the launch button on `/admin/purchases`: each gets a free month and an email, then the usual reminders, and goes offline at the end without a card (a month paid during it starts when it ends). Billing is off until `HYP_MASOF`/`HYP_KEY`/`HYP_PASSP` are set; locally `PAYMENTS_FAKE=1` uses a fake gateway with its own payment page (`/dev/fake-hyp`), which the E2E tests use.
- **Error reporting**: Sentry, on Vercel only (`NEXT_PUBLIC_SENTRY_DSN`, see `.env.example`). Server and browser errors, no tracing or session replay. Emails, phone numbers, form contents, cookies and headers are stripped before sending (`src/lib/sentry-options.ts`).
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

Migration: `npm run db:migrate` locally. In production, every Vercel deploy runs `vercel-build` (`prisma migrate deploy && next build`), so migrations committed to `master` are applied to the production database on deploy - pushing a migration is applying it. That needs both `DATABASE_URL` and `DIRECT_URL` set on Vercel. A local `npm run build` never touches the database.
