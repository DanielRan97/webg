"use client";

import { useState } from "react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { COLOR_SWATCHES, isHexColor, readableOn } from "@/lib/color";
import { CTA_OPTIONS, DAY_NAMES, SOCIAL_LABELS, type SocialPlatform } from "@/lib/constants";
import { isPro } from "@/lib/plan";
import { sectionsForCategory } from "@/lib/site-defaults";
import { SLUG_BASE } from "@/lib/slug-format";
import type { SiteData } from "@/types/site";
import { Logo } from "@/templates/shared/Logo";
import { PlanComparisonModal } from "../PlanComparisonModal";
import { UrlPreview } from "./UrlPreview";
import type { SlugCheck } from "./SiteForm";
import { TemplatePicker } from "./TemplatePicker";
import { Button, ChoiceCard, Field, ImageUploader, Notice, StepTitle, TextArea, TextField, Toggle, cx, inputClass } from "../ui/ui";
import { TrashIcon } from "../ui/icons";

export interface StepProps {
  data: SiteData;
  update: (patch: Partial<SiteData>) => void;
  isNew: boolean;
  errors: Record<string, string>;
  /** The site's plan (BASIC/PRO) - only used by BasicsStep (banner), BrandingStep (premium template gating) and AddressStep (Pro URL preview, dual-plan awareness). */
  plan?: string;
  /** Live slug-availability feedback - only used by AddressStep. */
  slugCheck?: SlugCheck;
}

/* 1 ─ Business basics */
const CATEGORY_SEARCH_THRESHOLD = 8;

export function BasicsStep({ data, update, isNew, errors, plan }: StepProps) {
  const [categoryQuery, setCategoryQuery] = useState("");
  const [planModalOpen, setPlanModalOpen] = useState(false);
  function pickCategory(id: string) {
    const cat = getCategory(id);
    update({
      category: id,
      // Suggest good defaults for new sites only; never overwrite an existing site's choices.
      ...(isNew ? { sections: sectionsForCategory(id), primaryColor: cat.color, ctaType: cat.cta } : {}),
    });
  }
  const q = categoryQuery.trim();
  const visibleCategories = q ? CATEGORIES.filter((c) => c.label.includes(q)) : CATEGORIES;
  return (
    <div className="space-y-5">
      {isNew && plan !== undefined && !isPro({ plan }) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div>
            <p className="font-bold text-indigo-950">אתם בונים אתר עם WEBG Basic</p>
            <p className="mt-1 text-sm text-indigo-900">כל הכלים הדרושים לאתר מקצועי כלולים. תכונות Pro יסומנו במנעול 🔒 ותוכלו לשדרג בכל שלב.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setPlanModalOpen(true)}>מה כולל Pro?</Button>
        </div>
      )}
      <PlanComparisonModal open={planModalOpen} onClose={() => setPlanModalOpen(false)} />
      <StepTitle title="ספרו לנו על העסק" subtitle="רק הפרטים הבסיסיים. תמיד אפשר לשנות אחר כך." />
      <TextField
        label="איך קוראים לעסק?"
        required
        hint="השם שיופיע בראש האתר."
        placeholder="לדוגמה: הסלון של דניאל"
        value={data.businessName}
        onChange={(v) => update({ businessName: v })}
        error={errors.name}
        maxLength={80}
        autoFocus
      />
      <TextField
        label="כותרת משנה / תפקיד (לא חובה)"
        hint="שורה קצרה ליד השם, למשל תפקיד או התמחות."
        placeholder="לדוגמה: מפתחת Full-Stack"
        value={data.subtitle}
        onChange={(v) => update({ subtitle: v })}
        maxLength={80}
      />
      <div role="group" aria-labelledby="cat-label" className="space-y-2">
        <p id="cat-label" className="text-sm font-semibold text-gray-900">מה סוג העסק?</p>
        <p className="text-sm text-gray-600">לפי הבחירה נציע לכם חלקים שמתאימים לאתר.</p>
        {CATEGORIES.length > CATEGORY_SEARCH_THRESHOLD && (
          <TextField
            label="חיפוש סוג עסק"
            placeholder="לדוגמה: מספרה, עורך דין"
            value={categoryQuery}
            onChange={setCategoryQuery}
          />
        )}
        {visibleCategories.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-700">לא נמצא סוג עסק תואם. אפשר לבחור ״אחר״.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visibleCategories.map((c) => (
              <ChoiceCard key={c.id} selected={data.category === c.id} onClick={() => pickCategory(c.id)}>
                <span className="text-2xl" aria-hidden>{c.emoji}</span>
                {c.label}
              </ChoiceCard>
            ))}
          </div>
        )}
      </div>
      <TextArea
        label="ספרו בקצרה מה אתם עושים"
        hint="משפט או שניים. זה יופיע בראש האתר ובחלק ״קצת עלינו״."
        placeholder="לדוגמה: מספרה שכונתית בתל אביב. תספורות מדויקות ואווירה טובה."
        value={data.description}
        onChange={(v) => update({ description: v })}
        maxLength={600}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="טלפון" hint="לקוחות יוכלו להתקשר אליכם בלחיצה אחת." placeholder="לדוגמה: 050-1234567" type="tel" inputMode="tel" dir="ltr" value={data.phone} onChange={(v) => update({ phone: v })} error={errors.phone} />
        <TextField label="מספר WhatsApp (לא חובה)" hint="אם זה אותו מספר, אפשר להשאיר ריק." placeholder="לדוגמה: 050-1234567" type="tel" inputMode="tel" dir="ltr" value={data.whatsapp} onChange={(v) => update({ whatsapp: v })} error={errors.whatsapp} />
      </div>
      <TextField label="אימייל (לא חובה)" hint="יופיע באתר כדי שלקוחות יוכלו ליצור קשר." placeholder="לדוגמה: name@gmail.com" type="email" dir="ltr" value={data.email} onChange={(v) => update({ email: v })} error={errors.email} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="כתובת העסק (לא חובה)" hint="כדי שלקוחות ידעו איך להגיע." placeholder="לדוגמה: דיזנגוף 100" value={data.address} onChange={(v) => update({ address: v })} />
        <TextField label="עיר (לא חובה)" placeholder="לדוגמה: תל אביב" value={data.city} onChange={(v) => update({ city: v })} />
      </div>
    </div>
  );
}

/* 2 ─ Branding & design */
function ColorPicker({ label, hint, value, onChange, allowNone }: { label: string; hint: string; value: string; onChange: (v: string) => void; allowNone?: boolean }) {
  return (
    <div role="group" aria-label={label} className="space-y-2">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="text-sm text-gray-600">{hint}</p>
      <div className="flex flex-wrap items-center gap-2">
        {allowNone && (
          <button
            type="button"
            aria-pressed={value === ""}
            aria-label="ללא צבע משני"
            onClick={() => onChange("")}
            className={cx(
              "flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-xs font-bold text-gray-600",
              value === "" ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2" : "border-gray-300",
            )}
          >
            {value === "" ? <span aria-hidden>✓</span> : "ללא"}
          </button>
        )}
        {COLOR_SWATCHES.map((c) => {
          const on = value.toLowerCase() === c.hex;
          return (
            <button
              key={c.hex}
              type="button"
              aria-label={c.name}
              aria-pressed={on}
              onClick={() => onChange(c.hex)}
              className={cx("flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg font-bold", on ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2" : "border-white shadow")}
              style={{ background: c.hex, color: readableOn(c.hex) }}
            >
              {on && <span aria-hidden>✓</span>}
            </button>
          );
        })}
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-gray-400 px-4 text-sm font-semibold focus-within:outline focus-within:outline-2 focus-within:outline-indigo-600">
          צבע אחר
          <input type="color" aria-label={`${label}: צבע אחר`} value={isHexColor(value) ? value : "#2563eb"} onChange={(e) => onChange(e.target.value)} className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0" />
        </label>
      </div>
    </div>
  );
}

export function BrandingStep({ data, update, plan }: StepProps) {
  return (
    <div className="space-y-8">
      <StepTitle title="המראה של האתר" subtitle="בחרו לוגו וצבעים. בלי לוגו, ניצור לכם אחד פשוט מהאות הראשונה של העסק." />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">לוגו (לא חובה)</p>
        <p className="text-sm text-gray-600">אפשר להעלות לוגו או להשאיר ריק — ניצור סימן פשוט לפי שם העסק.</p>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Logo logoUrl={data.logoUrl} name={data.businessName || "עסק"} color={data.primaryColor} size={72} />
          <div className="flex flex-wrap items-center gap-2">
            <ImageUploader
              label={data.logoUrl ? "החלפת לוגו" : "העלאת לוגו"}
              hint="PNG, JPG או WEBP, עד 5MB."
              onUploaded={(u) => update({ logoUrl: u[0] })}
            />
            {data.logoUrl && <Button type="button" variant="ghost" onClick={() => update({ logoUrl: "" })}>הסרת הלוגו</Button>}
          </div>
        </div>
      </div>
      <ColorPicker label="הצבע הראשי של העסק" hint="הצבע הזה יופיע בכפתורים, בכותרת ובלוגו." value={data.primaryColor} onChange={(v) => update({ primaryColor: v })} />
      <ColorPicker label="צבע משני (לא חובה)" hint="לקישוטים קטנים כמו קווים ומחירים. אפשר לוותר." value={data.secondaryColor} onChange={(v) => update({ secondaryColor: v })} allowNone />
      <TemplatePicker data={data} plan={plan ?? "BASIC"} onPick={(id) => update({ templateId: id })} />
    </div>
  );
}

/* 3 ─ Opening hours */
export function HoursStep({ data, update, errors }: StepProps) {
  function setDay(day: number, patch: Partial<SiteData["hours"][number]>) {
    const hours = data.hours.map((h) => (h.day === day ? { ...h, ...patch } : h));
    update({ hours, ...(day === 6 && patch.isOpen !== undefined ? { openSaturday: patch.isOpen } : {}) });
  }
  return (
    <div className="space-y-6">
      <StepTitle title="מתי אתם פתוחים?" subtitle="הדליקו את הימים שבהם אתם עובדים, ובחרו שעות." />
      <ul className="space-y-2">
        {data.hours.map((h) => {
          const err = errors[`hours-${h.day}`];
          return (
            <li key={h.day} className={cx("rounded-2xl border p-3", h.isOpen ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50")}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-44 flex-1">
                  <Toggle checked={h.isOpen} onChange={(v) => setDay(h.day, { isOpen: v })} label={`יום ${DAY_NAMES[h.day]}`} onText="פתוח" offText="סגור" />
                </div>
                {h.isOpen && (
                  <div className="flex items-center gap-2" dir="ltr">
                    <input aria-label={`שעת פתיחה ביום ${DAY_NAMES[h.day]}`} aria-invalid={err ? true : undefined} type="time" value={h.openTime} onChange={(e) => setDay(h.day, { openTime: e.target.value })} className={`${inputClass} w-32`} />
                    <span aria-hidden className="text-gray-400">–</span>
                    <input aria-label={`שעת סגירה ביום ${DAY_NAMES[h.day]}`} aria-invalid={err ? true : undefined} type="time" value={h.closeTime} onChange={(e) => setDay(h.day, { closeTime: e.target.value })} className={`${inputClass} w-32`} />
                  </div>
                )}
              </div>
              {err && <p role="alert" className="mt-2 flex gap-1.5 text-sm font-medium text-red-700"><span aria-hidden>⚠</span>{err}</p>}
            </li>
          );
        })}
      </ul>
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">שבת וחגים</p>
          <p className="text-sm text-gray-600">המידע יוצג באתר לצד שעות הפתיחה.</p>
        </div>
        <Toggle checked={data.openSaturday} onChange={(v) => setDay(6, { isOpen: v })} label="פתוחים בשבת?" onText="כן" offText="לא" />
        <Toggle checked={data.openHolidays} onChange={(v) => update({ openHolidays: v })} label="פתוחים בחגים?" onText="כן" offText="לא" />
      </div>
    </div>
  );
}

/* 5 ─ Services / price list / menu (one list of items, shown by whichever sections are switched on) */
export function ServicesStep({ data, update, errors }: StepProps) {
  const cat = getCategory(data.category);
  const on = (t: string) => data.sections.some((s) => s.type === t && s.enabled);
  const menuOnly = on("menu") && !on("services") && !on("prices");
  const noun = menuOnly ? "מנה" : "שירות";
  const example = cat.sampleServices[0];
  const groups = [...new Set(data.services.map((s) => s.category.trim()).filter(Boolean))];
  function setItem(i: number, patch: Partial<SiteData["services"][number]>) {
    update({ services: data.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  }
  return (
    <div className="space-y-6">
      <StepTitle
        title={menuOnly ? "מה יש בתפריט?" : on("prices") ? "מה אתם מציעים ומה המחירים?" : "מה אתם מציעים?"}
        subtitle={
          menuOnly
            ? `הוסיפו ${noun}ים אחד אחד. המחיר לא חובה, ואפשר גם לדלג על השלב. אפשר לחלק לקבוצות, למשל ״ראשונות״ ו״קינוחים״.`
            : "הוסיפו את השירותים שלכם. מחיר ותיאור הם לא חובה, ואפשר לקבץ שירותים לפי קטגוריה."
        }
      />
      <div className="space-y-3">
        {data.services.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center">
            <p className="font-semibold">עדיין לא הוספתם {noun}ים</p>
            <p className="mt-1 text-sm text-gray-700">{menuOnly ? "תפריט עם מחירים עוזר ללקוחות להחליט מה להזמין." : "רשימה ברורה עוזרת ללקוחות להבין מה אתם עושים."}</p>
          </div>
        )}
        <datalist id="group-suggestions">{groups.map((g) => <option key={g} value={g} />)}</datalist>
        {data.services.map((s, i) => (
          <fieldset key={i} aria-label={`${noun} ${i + 1}`} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-500">{noun} {i + 1}</span>
              <button
                type="button"
                aria-label={`מחיקת ${noun} ${i + 1}`}
                onClick={() => update({ services: data.services.filter((_, idx) => idx !== i) })}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
              <TextField label={`שם ה${noun}`} placeholder={example ? `לדוגמה: ${example.name}` : undefined} value={s.name} onChange={(v) => setItem(i, { name: v })} error={errors[`service-${i}`]} maxLength={80} />
              <TextField label="מחיר (לא חובה)" hint="אפשר גם טקסט חופשי." placeholder="לדוגמה: 70 ₪" value={s.price} onChange={(v) => setItem(i, { price: v })} maxLength={30} />
            </div>
            <TextField label="תיאור קצר (לא חובה)" placeholder="לדוגמה: כולל ייעוץ, טיפול וסידור." value={s.description} onChange={(v) => setItem(i, { description: v })} maxLength={300} />
            <TextField label="קבוצה (לא חובה)" hint="שירותים באותה קבוצה יוצגו יחד, תחת כותרת. לדוגמה: תספורות, טיפולי פנים, משלוחים." placeholder={menuOnly ? "לדוגמה: ראשונות" : "לדוגמה: תספורות"} list="group-suggestions" value={s.category} onChange={(v) => setItem(i, { category: v })} maxLength={40} />
          </fieldset>
        ))}
        <Button type="button" variant="secondary" onClick={() => update({ services: [...data.services, { name: "", description: "", price: "", category: "" }] })}>
          + הוספת {noun}
        </Button>
      </div>
    </div>
  );
}

/* 6 ─ Images */
export function ImagesStep({ data, update }: StepProps) {
  const room = 12 - data.gallery.length;
  return (
    <div className="space-y-8">
      <StepTitle title="תמונות" subtitle="תמונה טובה עושה הבדל גדול. הכול כאן לא חובה." />
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">תמונה ראשית</p>
        <p className="text-sm text-gray-600">התמונה הגדולה בראש האתר. עדיף תמונה פשוטה בלי הרבה טקסט, כך שם העסק ייקרא היטב. בלי תמונה, נשתמש בצבע העסק.</p>
        {data.heroImageUrl ? (
          <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-100 sm:w-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.heroImageUrl} alt="התמונה הראשית שבחרתם לאתר" className="h-full w-full object-contain" />
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-700">עדיין לא נבחרה תמונה ראשית</p>
        )}
        <div className="space-y-2">
          <ImageUploader
            label={data.heroImageUrl ? "החלפת תמונה" : "העלאת תמונה ראשית"}
            hint="קובץ PNG, JPG או WEBP, עד 5MB. מומלץ תמונה לרוחב, לפחות 1600×900 פיקסלים."
            onUploaded={(u) => update({ heroImageUrl: u[0] })}
          />
          {data.heroImageUrl && <Button type="button" variant="ghost" onClick={() => update({ heroImageUrl: "" })}>הסרת התמונה</Button>}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">גלריה ({data.gallery.length} מתוך 12)</p>
        <p className="text-sm text-gray-600">תמונות מהעבודה או מהמקום, כדי שלקוחות יראו איך זה נראה. לכל תמונה אפשר להוסיף שם ומחיר, אם רוצים - זה לא חובה.</p>
        {data.gallery.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-700">עדיין אין תמונות בגלריה</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.gallery.map((g, i) => (
              <li key={g.url} className="space-y-3 rounded-2xl border border-gray-300 bg-white p-4">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={`תמונה ${i + 1} בגלריה`} className="aspect-square w-full rounded-xl object-cover" />
                  <button type="button" aria-label={`הסרת תמונה ${i + 1} מהגלריה`} onClick={() => update({ gallery: data.gallery.filter((_, idx) => idx !== i) })} className="absolute end-1 top-1 h-10 w-10 rounded-full bg-black/80 text-lg text-white">×</button>
                </div>
                <TextField label="שם / כותרת (לא חובה)" placeholder="לדוגמה: המבורגר הבית" value={g.title} onChange={(v) => update({ gallery: data.gallery.map((x, idx) => (idx === i ? { ...x, title: v } : x)) })} maxLength={80} />
                <TextField label="תיאור קצר (לא חובה)" placeholder="לדוגמה: 200 גרם בקר, צ'דר וביצת עין" value={g.description} onChange={(v) => update({ gallery: data.gallery.map((x, idx) => (idx === i ? { ...x, description: v } : x)) })} maxLength={300} />
                <TextField label="מחיר (לא חובה)" placeholder="לדוגמה: 68 ₪, החל מ-250 ₪" value={g.price} onChange={(v) => update({ gallery: data.gallery.map((x, idx) => (idx === i ? { ...x, price: v } : x)) })} maxLength={30} />
              </li>
            ))}
          </ul>
        )}
        <ImageUploader
          label="הוספת תמונות לגלריה"
          hint="אפשר לבחור כמה תמונות יחד. PNG, JPG או WEBP, עד 5MB לתמונה. מומלץ לפחות 800×800 פיקסלים."
          multiple
          disabled={room <= 0}
          onUploaded={(u) => update({ gallery: [...data.gallery, ...u.map((url) => ({ url, title: "", description: "", price: "" }))].slice(0, 12) })}
        />
      </div>
    </div>
  );
}

/* 7 ─ Social & contact */
/** Full-link examples, matching socialUrl()'s own base URLs (@/lib/links) - a bare handle still works too (backward-compatible with existing sites), but the wizard should ask for the full link so it's unambiguous. */
const SOCIAL_URL_EXAMPLES: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/yourbusiness",
  facebook: "https://facebook.com/yourbusiness",
  tiktok: "https://tiktok.com/@yourbusiness",
  linkedin: "https://linkedin.com/in/yourname",
  github: "https://github.com/username",
};

export function SocialStep({ data, update }: StepProps) {
  const cat = getCategory(data.category);
  const isPortfolio = cat.id === "portfolio";
  return (
    <div className="space-y-6">
      <StepTitle title="איך לקוחות יגיעו אליכם?" />
      <div role="group" aria-labelledby="cta-label" className="space-y-2">
        <p id="cta-label" className="text-sm font-semibold text-gray-900">מה תרצו שהלקוחות יעשו?</p>
        <p className="text-sm text-gray-600">זה הכפתור הגדול שיופיע בראש האתר.</p>
        <div className="grid grid-cols-2 gap-3">
          {CTA_OPTIONS.map((o) => (
            <ChoiceCard key={o.value} selected={data.ctaType === o.value} onClick={() => update({ ctaType: o.value })}>
              {o.label}
            </ChoiceCard>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">רשתות חברתיות (לא חובה)</p>
          <p className="text-sm text-gray-600">הדביקו את הקישור המלא לפרופיל שלכם. מה שתשאירו ריק לא יופיע.</p>
        </div>
        {cat.socialPlatforms.map((p) => (
          <TextField key={p} label={SOCIAL_LABELS[p]} hint="הקישור המלא לעמוד, לא רק שם המשתמש." dir="ltr" placeholder={`לדוגמה: ${SOCIAL_URL_EXAMPLES[p]}`} value={data.socials[p]} onChange={(v) => update({ socials: { ...data.socials, [p]: v } })} />
        ))}
      </div>
      {isPortfolio && (
        <TextField label="קישור להורדת קורות חיים (לא חובה)" hint="קישור לקובץ PDF שהעליתם לאחסון חיצוני (Google Drive וכדומה)." dir="ltr" placeholder="לדוגמה: drive.google.com/..." value={data.resumeUrl} onChange={(v) => update({ resumeUrl: v })} maxLength={300} />
      )}
    </div>
  );
}

/* Edit mode only ─ site address */
function SlugAvailability({ status }: { status: SlugCheck["status"] }) {
  if (status === "checking") return <p className="flex items-center gap-1.5 text-sm text-gray-600"><span aria-hidden>…</span> בודקים זמינות...</p>;
  if (status === "available") return <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700"><span aria-hidden>✓</span> הכתובת זמינה</p>;
  if (status === "taken") return <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700"><span aria-hidden>✗</span> הכתובת הזו כבר תפוסה</p>;
  if (status === "invalid") return <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700"><span aria-hidden>✗</span> אפשר להשתמש באותיות באנגלית, מספרים ומקפים בלבד</p>;
  return null;
}

export function AddressStep({ data, update, errors, plan, slugCheck }: StepProps) {
  const pro = plan !== undefined && isPro({ plan });
  return (
    <div className="space-y-6">
      <StepTitle title="מה תהיה כתובת האתר?" subtitle="בחרו כתובת קצרה שקל לזכור. תוכלו לראות איך היא תיראה בכל חבילה." />
      <Field label="הכתובת שלכם" hint="באנגלית, מספרים ומקפים בלבד. לדוגמה: daniel-barber" error={errors.slug}>
        {(p) => (
          <div className="flex flex-wrap items-center gap-2" dir="ltr">
            <span className="text-gray-700">{SLUG_BASE}</span>
            <input {...p} value={data.slug} onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className={cx(inputClass, "flex-1")} maxLength={40} />
          </div>
        )}
      </Field>
      {slugCheck && slugCheck.slug === data.slug.trim().toLowerCase() && <SlugAvailability status={slugCheck.status} />}
      <UrlPreview slug={data.slug} pro={pro} />
      <Notice kind="info">אם תשנו את הכתובת אחר כך, הכתובת הקודמת תפסיק לעבוד. עדכנו אותה בכרטיסי ביקור והודעות.</Notice>
    </div>
  );
}
