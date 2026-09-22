# WEBG - Web Generate

Fill in your business details, get a website. Hebrew / RTL-first SaaS for small businesses in Israel.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS 4 · Prisma · SQLite (dev) · cookie sessions (`jose` + `bcryptjs`).

## Quick start

```bash
npm install
cp .env.example .env        # already present after setup; set a real SESSION_SECRET for production
npm run db:migrate          # creates prisma/dev.db and applies migrations
npm run db:seed             # optional: demo user + 2 sample sites
npm run dev                 # http://localhost:3000
```

Demo login after seeding: `demo@webg.co.il` / `demo1234`
Sample public site: `/s/daniel-barber` (published). `cafe-hapina` is a draft.

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:reset` (wipes + reseeds).

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
- **Uploads** are saved to `./uploads` and served from `/api/files/[name]` (`src/lib/storage.ts`). Swap the adapter for S3/R2 in production.

## Switching from SQLite to PostgreSQL

The schema is deliberately provider-neutral: no enums, no `Json`, no native `@db.*` types. Status fields are strings whose allowed values live in `src/lib/constants.ts`. All DB access goes through Prisma.

1. Create a Postgres database (Neon, Supabase, RDS, local).
2. In `prisma/schema.prisma` change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/webg?schema=public"` in `.env`.
4. The existing `prisma/migrations` folder was generated for SQLite, so start a fresh history:
   ```bash
   rm -rf prisma/migrations prisma/dev.db
   npx prisma migrate dev --name init
   npm run db:seed
   ```
   (For an existing production SQLite database with data you want to keep, export the rows and import them into the new database after step 4.)
5. In production deploy migrations with `npx prisma migrate deploy`.

Optional hardening after moving: convert the status strings to Prisma enums, add `@db.Text` to long text, and add a DB `CHECK` on `Website.status`.

## Roadmap

- **Phase 3:** payments, custom domains, analytics, AI copy, SEO tools.

## Existing websites and data compatibility

Phase 2 only **adds** things: new tables (testimonials, service areas, FAQ, highlights), new optional columns (menu/price group, emergency and booking settings), all with defaults. Sites saved before Phase 2 keep every value and every section exactly as it was; sections that did not exist yet are appended **switched off**, so nothing appears or disappears on a live site. Switching templates only changes `templateId`.

Migration: `npm run db:migrate` (or `npx prisma migrate deploy` in production).

`npm run db:seed` resets the `demo@webg.co.il` account and creates one published sample site per business type. Do not use that account for real work.
