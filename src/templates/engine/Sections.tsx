import type { ReactNode } from "react";
import { DAY_NAMES, SOCIAL_LABELS, SOCIAL_PLATFORMS } from "@/lib/constants";
import { mapsEmbedSrc, mapsQueryHref, normalizeUrl, socialUrl, telHref, whatsappHref } from "@/lib/links";
import { SECTION_META, type SectionType } from "@/lib/sections";
import type { SiteData } from "@/types/site";
import { BoltIcon, CalendarIcon, ChatIcon, MailIcon, PhoneIcon, PinIcon, PlusIcon, StarIcon, TruckIcon } from "../shared/Icons";
import { bookingCta, formatPrice, groupItems } from "../shared/helpers";
import { ContactForm } from "./ContactForm";
import { Gallery } from "./Gallery";
import { LeadForm } from "./LeadForm";
import type { TemplateTheme } from "./types";

/**
 * Every section of a website, implemented once. Templates only supply a theme
 * (class strings) and their own header/hero, so all templates support all sections.
 */
interface Ctx {
  d: SiteData;
  t: TemplateTheme;
  /** When the price list is visible, service cards leave prices out to avoid repeating them. */
  pricesVisible: boolean;
}

const ext = (external: boolean) => (external ? { target: "_blank", rel: "noopener noreferrer" } : {});

function GroupTitle({ title, t }: { title: string; t: TemplateTheme }) {
  if (!title) return null;
  return <h3 className={`mb-4 text-lg font-bold text-t-accent-text ${t.heading}`}>{title}</h3>;
}

function ServiceCards({ d, t, pricesVisible }: Ctx) {
  const items = d.services.filter((s) => s.name.trim());
  return (
    <div className="space-y-8">
      {groupItems(items).map((g, gi) => (
        <div key={gi}>
          <GroupTitle title={g.title} t={t} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((s, i) => (
              <div key={i} className={t.card}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className={`text-lg font-semibold ${t.heading}`}>{s.name}</h4>
                  {s.price && !pricesVisible && <span className="shrink-0 font-bold text-t-accent-text">{formatPrice(s.price)}</span>}
                </div>
                {s.description && <p className="mt-2 text-sm text-t-muted">{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Used for both the price list (priced items only) and the menu. */
function RowList({ d, t, onlyPriced }: Ctx & { onlyPriced?: boolean }) {
  const items = d.services.filter((s) => s.name.trim() && (!onlyPriced || s.price.trim()));
  return (
    <div className="space-y-8">
      {groupItems(items).map((g, gi) => (
        <div key={gi} className={t.narrow}>
          <GroupTitle title={g.title} t={t} />
          <ul className={t.rowList}>
            {g.items.map((s, i) => (
              <li key={i} className={t.row}>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  {s.description && <p className="text-sm font-normal text-t-muted">{s.description}</p>}
                </div>
                {s.price && <span className="shrink-0 font-bold text-t-accent-text">{formatPrice(s.price)}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Hours({ d, t }: Ctx) {
  return (
    <div className={`max-w-md ${t.narrow} ${t.card}`}>
      <ul className="divide-y divide-t-line">
        {d.hours.map((h) => (
          <li key={h.day} className="flex justify-between py-2.5">
            <span className="font-medium">{DAY_NAMES[h.day]}</span>
            <span className={h.isOpen ? "" : "text-t-muted"} dir="ltr">
              {h.isOpen ? `${h.openTime || "—"} – ${h.closeTime || "—"}` : "סגור"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-t-muted">{d.openHolidays ? "פתוחים גם בחגים" : "בחגים סגור"}</p>
    </div>
  );
}

function Location({ d, t }: Ctx) {
  const full = [d.address, d.city].filter(Boolean).join(", ");
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="flex items-start gap-2 text-xl font-semibold"><PinIcon className="mt-1 shrink-0" />{full}</p>
        <a href={mapsQueryHref(d.address, d.city)} {...ext(true)} className={`${t.btn} ${t.btnPrimary} mt-5`}>
          נווטו אלינו
        </a>
      </div>
      <iframe title="מפה שמראה את מיקום העסק" src={mapsEmbedSrc(d.address, d.city)} loading="lazy"
        className={`h-64 w-full ${t.media}`} />
    </div>
  );
}

function Contact({ d, t }: Ctx) {
  const wa = d.whatsapp || d.phone;
  return (
    <div className={`flex flex-wrap gap-3 ${t.center ? "justify-center" : ""}`}>
      {d.phone && <a href={telHref(d.phone)} className={`${t.btn} ${t.btnPrimary}`}><PhoneIcon /> {d.phone}</a>}
      {wa && <a href={whatsappHref(wa)} {...ext(true)} className={`${t.btn} ${t.btnWhatsApp}`}><ChatIcon /> WhatsApp</a>}
      {d.email && <a href={`mailto:${d.email}`} className={`${t.btn} ${t.btnSecondary}`}><MailIcon /> <span dir="ltr">{d.email}</span></a>}
      {d.resumeUrl && <a href={normalizeUrl(d.resumeUrl)} {...ext(true)} className={`${t.btn} ${t.btnSecondary}`}>הורדת קורות חיים</a>}
    </div>
  );
}

function Social({ d, t }: Ctx) {
  return (
    <div className={`flex flex-wrap gap-3 ${t.center ? "justify-center" : ""}`}>
      {SOCIAL_PLATFORMS.filter((p) => d.socials[p].trim()).map((p) => (
        <a key={p} href={socialUrl(p, d.socials[p])} {...ext(true)} className={`${t.btn} ${t.btnSecondary}`}>{SOCIAL_LABELS[p]}</a>
      ))}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  if (rating < 1) return null;
  return (
    <span role="img" aria-label={`דירוג ${rating} מתוך 5`} className="flex gap-0.5 text-t-accent-text">
      {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} filled={n <= rating} width={18} height={18} />)}
    </span>
  );
}

function Testimonials({ d, t }: Ctx) {
  const items = d.testimonials.filter((x) => x.name.trim() && x.text.trim());
  return (
    <ul className={`grid gap-4 ${items.length === 1 ? `max-w-2xl ${t.narrow}` : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {items.map((x, i) => (
        <li key={i} className={`${t.card} flex flex-col gap-4`}>
          <Stars rating={x.rating} />
          <blockquote className="flex-1 whitespace-pre-line leading-relaxed">“{x.text}”</blockquote>
          <div className="flex items-center gap-3">
            {x.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={x.imageUrl} alt="" width={44} height={44} loading="lazy" className="h-11 w-11 rounded-full object-cover" />
            )}
            <cite className="font-semibold not-italic">{x.name}</cite>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Areas({ d, t }: Ctx) {
  return (
    <ul className={`flex flex-wrap gap-2 ${t.center ? "justify-center" : ""}`}>
      {d.areas.filter((a) => a.trim()).map((a, i) => <li key={i} className={t.chip}>{a}</li>)}
    </ul>
  );
}

function Emergency({ d, t }: Ctx) {
  const phone = d.emergency.phone.trim() || d.phone;
  return (
    <div className={`max-w-3xl ${t.narrow} ${t.panel} bg-[#b91c1c] text-white ${t.center ? "text-center" : ""}`}>
      <div className={`flex flex-wrap items-center gap-3 ${t.center ? "justify-center" : ""}`}>
        <BoltIcon width={28} height={28} />
        {d.emergency.available24x7 && <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#991b1b]">זמינים 24/7</span>}
      </div>
      <p className="mt-4 text-xl font-semibold leading-relaxed md:text-2xl">
        {d.emergency.message.trim() || "תקלה דחופה? אנחנו כאן."}
      </p>
      {phone && (
        <a href={telHref(phone)} className={`${t.btn} mt-6 bg-white text-[#991b1b]`}>
          <PhoneIcon /> <span dir="ltr">{phone}</span>
        </a>
      )}
    </div>
  );
}

function Booking({ d, t }: Ctx) {
  const cta = bookingCta(d);
  if (!cta) return null;
  return (
    <div className={`max-w-3xl ${t.narrow} ${t.panel} bg-t-brand text-t-brand-fg ${t.center ? "text-center" : ""}`}>
      <CalendarIcon width={28} height={28} className={t.center ? "mx-auto" : ""} />
      <p className="mt-3 text-xl font-semibold md:text-2xl">מוכנים לקבוע? זה לוקח דקה.</p>
      <a href={cta.href} {...ext(cta.external)} className={`${t.btn} mt-6 bg-white text-neutral-900`}>{cta.label}</a>
    </div>
  );
}

function Faq({ d, t }: Ctx) {
  return (
    <div className={`max-w-3xl space-y-3 ${t.narrow}`}>
      {d.faq.filter((f) => f.question.trim() && f.answer.trim()).map((f, i) => (
        <details key={i} className={`group ${t.card} !p-0`}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
            {f.question}
            <PlusIcon className="shrink-0 transition group-open:rotate-45" />
          </summary>
          <p className="whitespace-pre-line px-5 pb-5 leading-relaxed text-t-muted">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

const HIGHLIGHT_COLS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };
function Highlights({ d, t }: Ctx) {
  const items = d.highlights.filter((h) => h.label.trim() && h.value.trim());
  return (
    <dl className={`grid grid-cols-2 gap-4 ${HIGHLIGHT_COLS[Math.min(items.length, 4)]}`}>
      {items.map((h, i) => (
        <div key={i} className={`${t.card} flex flex-col text-center`}>
          <dt className="order-2 mt-1 text-sm text-t-muted">{h.label}</dt>
          <dd className={`order-1 text-4xl font-extrabold text-t-accent-text ${t.heading}`}>{h.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ExperienceList({ d, t }: Ctx) {
  const items = d.experience.filter((e) => e.organization.trim() && e.role.trim());
  return (
    <ul className={`space-y-4 ${t.narrow}`}>
      {items.map((e, i) => (
        <li key={i} className={t.card}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className={`text-lg font-semibold ${t.heading}`}>{e.role} · {e.organization}</h4>
            {(e.startDate || e.endDate) && (
              <span className="shrink-0 text-sm text-t-muted" dir="ltr">{e.startDate || "…"} – {e.endDate || "היום"}</span>
            )}
          </div>
          {e.description && <p className="mt-2 whitespace-pre-line text-sm text-t-muted">{e.description}</p>}
        </li>
      ))}
    </ul>
  );
}

function EducationList({ d, t }: Ctx) {
  const items = d.education.filter((e) => e.institution.trim());
  return (
    <ul className={`space-y-4 ${t.narrow}`}>
      {items.map((e, i) => (
        <li key={i} className={t.card}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className={`text-lg font-semibold ${t.heading}`}>{e.institution}{e.field ? ` · ${e.field}` : ""}</h4>
            {e.dates && <span className="shrink-0 text-sm text-t-muted" dir="ltr">{e.dates}</span>}
          </div>
          {e.description && <p className="mt-2 whitespace-pre-line text-sm text-t-muted">{e.description}</p>}
        </li>
      ))}
    </ul>
  );
}

function Skills({ d, t }: Ctx) {
  return (
    <ul className={`flex flex-wrap gap-2 ${t.center ? "justify-center" : ""}`}>
      {d.skills.filter((s) => s.name.trim()).map((s, i) => <li key={i} className={t.chip}>{s.name}</li>)}
    </ul>
  );
}

function Projects({ d, t }: Ctx) {
  const items = d.projects.filter((p) => p.title.trim());
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <div key={i} className={`${t.card} flex flex-col gap-3`}>
          {p.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.title} loading="lazy" className={`aspect-video w-full object-cover ${t.media}`} />
          )}
          <h4 className={`text-lg font-semibold ${t.heading}`}>{p.title}</h4>
          {p.description && <p className="flex-1 text-sm text-t-muted">{p.description}</p>}
          {p.link && (
            <a href={normalizeUrl(p.link)} {...ext(true)} className={`${t.btn} ${t.btnSecondary} self-start`}>לצפייה בפרויקט</a>
          )}
        </div>
      ))}
    </div>
  );
}

function Certifications({ d, t }: Ctx) {
  const items = d.certifications.filter((c) => c.name.trim());
  return (
    <div className={t.narrow}>
      <ul className={t.rowList}>
        {items.map((c, i) => (
          <li key={i} className={t.row}>
            <div>
              <p className="font-semibold">{c.name}</p>
              {(c.issuer || c.date) && (
                <p className="text-sm font-normal text-t-muted">{[c.issuer, c.date].filter(Boolean).join(" · ")}</p>
              )}
            </div>
            {c.link && (
              <a href={normalizeUrl(c.link)} {...ext(true)} className="shrink-0 font-semibold text-t-accent-text underline">אימות</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Delivery({ d, t }: Ctx) {
  const del = d.delivery;
  const rows: { label: string; value: string }[] = [
    del.areas.trim() && { label: "אזורי משלוח", value: del.areas },
    del.fee.trim() && { label: "מחיר משלוח", value: del.fee },
    del.minOrder.trim() && { label: "מינימום הזמנה", value: del.minOrder },
    del.freeOver.trim() && { label: "משלוח חינם", value: del.freeOver },
    del.time.trim() && { label: "זמן משלוח משוער", value: del.time },
  ].filter((r): r is { label: string; value: string } => Boolean(r));
  return (
    <div className={`max-w-xl ${t.narrow} ${t.card}`}>
      <div className="flex items-center gap-2 text-t-accent-text">
        <TruckIcon />
        <span className="text-lg font-semibold">משלוחים זמינים</span>
      </div>
      {rows.length > 0 && (
        <dl className="mt-4 space-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4">
              <dt className="text-t-muted">{r.label}</dt>
              <dd className="text-end font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {del.note.trim() && <p className="mt-4 whitespace-pre-line text-sm text-t-muted">{del.note}</p>}
    </div>
  );
}

/** The body of a section (without its title). The hero is rendered by each template. */
export function renderSectionBody(type: SectionType, ctx: Ctx): ReactNode {
  const { d, t } = ctx;
  switch (type) {
    case "hero": return null;
    case "about": return <p className={`max-w-3xl whitespace-pre-line text-lg leading-relaxed text-t-muted ${t.narrow}`}>{d.description}</p>;
    case "services": return <ServiceCards {...ctx} />;
    case "prices": return <RowList {...ctx} onlyPriced />;
    case "menu": return <RowList {...ctx} />;
    case "gallery": return <Gallery d={d} t={t} />;
    case "highlights": return <Highlights {...ctx} />;
    case "testimonials": return <Testimonials {...ctx} />;
    case "areas": return <Areas {...ctx} />;
    case "emergency": return <Emergency {...ctx} />;
    case "booking": return <Booking {...ctx} />;
    case "faq": return <Faq {...ctx} />;
    case "hours": return <Hours {...ctx} />;
    case "location": return <Location {...ctx} />;
    case "contact": return <Contact {...ctx} />;
    case "social": return <Social {...ctx} />;
    case "experience": return <ExperienceList {...ctx} />;
    case "education": return <EducationList {...ctx} />;
    case "skills": return <Skills {...ctx} />;
    case "projects": return <Projects {...ctx} />;
    case "certifications": return <Certifications {...ctx} />;
    case "delivery": return <Delivery {...ctx} />;
    case "inquiry": return <ContactForm slug={d.slug} t={t} />;
    case "lead": return <LeadForm slug={d.slug} t={t} />;
  }
}

/** Section wrapper: spacing, background rhythm and the template's title style. */
export function SectionFrame({ type, index, t, children }: { type: SectionType; index: number; t: TemplateTheme; children: ReactNode }) {
  const title = SECTION_META[type].label;
  const bg = t.rhythm === "alt" && index % 2 === 1 ? "bg-t-tint" : "";
  const line = t.rhythm === "lines" ? "border-t border-t-line" : "";
  const c = t.center;
  const h = t.heading;
  const heading = {
    bar: (
      <h2 id={`h-${type}`} className={`mb-10 text-2xl font-bold md:text-3xl ${h}`}>
        {title}
        <span className={`mt-2 block h-1 w-12 rounded-full bg-t-accent ${c ? "mx-auto" : ""}`} />
      </h2>
    ),
    ornament: (
      <div className="mb-12 text-center">
        <h2 id={`h-${type}`} className={`text-3xl md:text-4xl ${h}`}>{title}</h2>
        <span aria-hidden className="mx-auto mt-4 flex w-40 items-center gap-3">
          <span className="h-px flex-1 bg-t-line" />
          <span className="h-1.5 w-1.5 rotate-45 bg-t-accent" />
          <span className="h-px flex-1 bg-t-line" />
        </span>
      </div>
    ),
    quiet: <h2 id={`h-${type}`} className={`mb-8 text-sm tracking-[0.2em] text-t-muted ${h}`}>{title}</h2>,
    block: (
      <h2 id={`h-${type}`} className="mb-10">
        <span className={`inline-block rounded-md border-[3px] border-black bg-t-brand px-4 py-1 text-2xl text-t-brand-fg shadow-[4px_4px_0_0_#000] md:text-4xl ${h}`}>{title}</span>
      </h2>
    ),
    glow: (
      <h2 id={`h-${type}`} className={`mb-10 text-2xl md:text-3xl ${h}`}>
        {title}
        <span className="mt-3 block h-1 w-14 rounded-full bg-t-accent shadow-[0_0_16px_var(--t-accent)]" />
      </h2>
    ),
  }[t.titleStyle];

  return (
    <section id={`sec-${type}`} aria-labelledby={`h-${type}`} className={`scroll-mt-20 px-5 ${t.section} ${t.sectionExtra} ${bg} ${line}`}>
      <div className={t.container}>
        {heading}
        {children}
      </div>
    </section>
  );
}
