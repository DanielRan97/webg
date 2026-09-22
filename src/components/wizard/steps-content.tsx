"use client";

import { useState } from "react";
import { BOOKING_LABELS, BOOKING_METHODS } from "@/lib/constants";
import type { SiteData } from "@/types/site";
import { Button, ChoiceCard, Field, ImageUploader, Notice, StepTitle, TextArea, TextField, Toggle, cx, inputClass } from "../ui/ui";
import type { StepProps } from "./steps";

/** Small helper: replace one item in a list by index. */
function setAt<T>(list: T[], i: number, patch: Partial<T>): T[] {
  return list.map((x, idx) => (idx === i ? { ...x, ...patch } : x));
}
const removeAt = <T,>(list: T[], i: number) => list.filter((_, idx) => idx !== i);

function RemoveButton({ what, onClick }: { what: string; onClick: () => void }) {
  return (
    <Button type="button" variant="danger" className="min-h-11" aria-label={`מחיקת ${what}`} onClick={onClick}>
      🗑 מחיקה
    </Button>
  );
}

function EmptyBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-gray-700">{text}</p>
    </div>
  );
}

/* ── Testimonials ── */
export function TestimonialsStep({ data, update, errors }: StepProps) {
  const list = data.testimonials;
  return (
    <div className="space-y-6">
      <StepTitle title="מה לקוחות אומרים עליכם?" subtitle="המלצות אמיתיות מלקוחות מרוצים נותנות אמון. אפשר להוסיף כמה שרוצים, ואפשר לדלג." />
      <Notice kind="info">כדאי לבקש מהלקוח רשות לפני שמפרסמים את שמו ואת התמונה שלו.</Notice>
      {list.length === 0 && <EmptyBox title="עדיין לא הוספתם המלצות" text="לחצו על ״הוספת המלצה״ וכתבו מה הלקוח אמר." />}
      {list.map((t, i) => {
        const err = errors[`testimonial-${i}`];
        return (
          <fieldset key={i} className="space-y-3 rounded-2xl border border-gray-300 bg-white p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700">המלצה {i + 1}</legend>
            <TextField label="שם הלקוח" placeholder="לדוגמה: דנה כהן" value={t.name} onChange={(v) => update({ testimonials: setAt(list, i, { name: v }) })} error={!t.name.trim() ? err : undefined} maxLength={60} />
            <TextArea label="מה הלקוח אמר?" placeholder="לדוגמה: שירות מעולה, הגיעו בזמן והכול נעשה מסודר." rows={3} value={t.text} onChange={(v) => update({ testimonials: setAt(list, i, { text: v }) })} error={t.name.trim() ? err : undefined} maxLength={500} />
            <div role="group" aria-label="דירוג" className="space-y-1.5">
              <p className="text-sm font-semibold text-gray-900">דירוג (לא חובה)</p>
              <div className="flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-pressed={t.rating === n} aria-label={n === 1 ? "כוכב אחד" : `${n} כוכבים`} onClick={() => update({ testimonials: setAt(list, i, { rating: n }) })}
                    className={cx("h-11 w-11 rounded-lg text-2xl", n <= t.rating ? "text-amber-700" : "text-gray-500")}>
                    <span aria-hidden>{n <= t.rating ? "★" : "☆"}</span>
                  </button>
                ))}
                {t.rating > 0 && <Button type="button" variant="ghost" className="min-h-11" onClick={() => update({ testimonials: setAt(list, i, { rating: 0 }) })}>ללא דירוג</Button>}
              </div>
              <p className="text-sm text-gray-700" aria-live="polite">{t.rating > 0 ? `${t.rating} מתוך 5` : "לא נבחר דירוג"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">תמונה של הלקוח (לא חובה)</p>
              {t.imageUrl && (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageUrl} alt={`התמונה של ${t.name || "הלקוח"}`} className="h-14 w-14 rounded-full object-cover" />
                  <Button type="button" variant="ghost" onClick={() => update({ testimonials: setAt(list, i, { imageUrl: "" }) })}>הסרת התמונה</Button>
                </div>
              )}
              <ImageUploader label={t.imageUrl ? "החלפת תמונה" : "הוספת תמונה"} hint="תמונה קטנה ומרובעת, לפחות 200×200 פיקסלים. PNG, JPG או WEBP, עד 5MB." onUploaded={(u) => update({ testimonials: setAt(list, i, { imageUrl: u[0] }) })} />
            </div>
            <RemoveButton what={`המלצה ${i + 1}`} onClick={() => update({ testimonials: removeAt(list, i) })} />
          </fieldset>
        );
      })}
      <Button type="button" variant="secondary" disabled={list.length >= 20} onClick={() => update({ testimonials: [...list, { name: "", text: "", rating: 0, imageUrl: "" }] })}>
        + הוספת המלצה
      </Button>
    </div>
  );
}

/* ── Service areas ── */
export function AreasStep({ data, update }: StepProps) {
  const [draft, setDraft] = useState("");
  function add() {
    const names = draft.split(/[,،\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const merged = [...data.areas];
    for (const n of names) if (!merged.includes(n) && merged.length < 60) merged.push(n);
    update({ areas: merged });
    setDraft("");
  }
  return (
    <div className="space-y-6">
      <StepTitle title="לאילו אזורים אתם מגיעים?" subtitle="כתבו עיר או אזור ולחצו על ״הוספה״. אפשר לכתוב כמה ערים יחד, עם פסיק ביניהן." />
      <Field label="עיר או אזור" hint="לדוגמה: תל אביב, רמת גן, גוש דן">
        {(p) => (
          <div className="flex gap-2">
            <input {...p} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} className={inputClass} maxLength={120} />
            <Button type="button" onClick={add} disabled={!draft.trim()}>הוספה</Button>
          </div>
        )}
      </Field>
      {data.areas.length === 0 ? (
        <EmptyBox title="עדיין לא הוספתם אזורים" text="הלקוחות יראו באילו ערים אתם עובדים." />
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="האזורים שהוספתם">
          {data.areas.map((a, i) => (
            <li key={a} className="flex items-center gap-1 rounded-full border border-gray-400 bg-white ps-4">
              <span className="py-2">{a}</span>
              <button type="button" aria-label={`הסרת ${a}`} onClick={() => update({ areas: removeAt(data.areas, i) })} className="h-11 w-11 rounded-full text-lg hover:bg-gray-100"><span aria-hidden>×</span></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Emergency ── */
export function EmergencyStep({ data, update, errors }: StepProps) {
  const e = data.emergency;
  const set = (patch: Partial<SiteData["emergency"]>) => update({ emergency: { ...e, ...patch } });
  return (
    <div className="space-y-6">
      <StepTitle title="שירות חירום" subtitle="אם אתם מגיעים גם לתקלות דחופות, הלקוחות יראו את זה בבלוק בולט." />
      <div className="rounded-2xl bg-gray-50 p-4">
        <Toggle checked={e.available24x7} onChange={(v) => set({ available24x7: v })} label="זמינים 24 שעות ביממה?" hint="יוצג באתר תג ״זמינים 24/7״." onText="כן" offText="לא" />
      </div>
      <TextField label="טלפון לשעת חירום (לא חובה)" hint="אם תשאירו ריק, נשתמש בטלפון הרגיל של העסק." placeholder="לדוגמה: 050-1234567" type="tel" inputMode="tel" dir="ltr" value={e.phone} onChange={(v) => set({ phone: v })} error={errors["emergency-phone"]} />
      <TextArea label="הודעה קצרה ללקוחות (לא חובה)" hint="משפט אחד שמסביר מה אפשר לעשות במקרה דחוף." placeholder="לדוגמה: תקלה דחופה? התקשרו ונגיע בהקדם." rows={2} value={e.message} onChange={(v) => set({ message: v })} maxLength={200} />
    </div>
  );
}

/* ── Booking ── */
export function BookingStep({ data, update, errors }: StepProps) {
  const b = data.booking;
  const set = (patch: Partial<SiteData["booking"]>) => update({ booking: { ...b, ...patch } });
  return (
    <div className="space-y-6">
      <StepTitle title="איך קובעים תור?" subtitle="נוסיף לאתר כפתור גדול. זו לא מערכת תורים: הלקוח עובר אליכם בלחיצה." />
      <div role="group" aria-labelledby="booking-how" className="space-y-2">
        <p id="booking-how" className="text-sm font-semibold text-gray-900">איך הלקוח יקבע תור?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {BOOKING_METHODS.map((m) => (
            <ChoiceCard key={m} selected={b.method === m} onClick={() => set({ method: m })}>
              {BOOKING_LABELS[m].label}
              <span className="text-xs font-normal text-gray-700">{BOOKING_LABELS[m].hint}</span>
            </ChoiceCard>
          ))}
        </div>
        {errors["booking-method"] && <p role="alert" className="flex gap-1.5 text-sm font-medium text-red-700"><span aria-hidden>⚠</span>{errors["booking-method"]}</p>}
      </div>
      {b.method === "LINK" && (
        <TextField label="הקישור ליומן התורים" hint="הדביקו את הקישור מהאתר שבו קובעים תור." placeholder="לדוגמה: calendly.com/השם-שלכם" dir="ltr" value={b.url} onChange={(v) => set({ url: v })} error={errors["booking-url"]} maxLength={300} />
      )}
      <TextField label="מה יהיה כתוב על הכפתור? (לא חובה)" hint="אם תשאירו ריק, יהיה כתוב ״קבעו תור״." placeholder="לדוגמה: קבעו תור" value={b.buttonText} onChange={(v) => set({ buttonText: v })} maxLength={30} />
      <p className="text-sm text-gray-700">
        כך ייראה הכפתור: <span className="ms-1 inline-block rounded-full bg-indigo-700 px-5 py-2 font-semibold text-white">{b.buttonText.trim() || "קבעו תור"}</span>
      </p>
    </div>
  );
}

/* ── FAQ ── */
export function FaqStep({ data, update, errors }: StepProps) {
  const list = data.faq;
  return (
    <div className="space-y-6">
      <StepTitle title="שאלות שלקוחות שואלים" subtitle="כתבו את השאלות שחוזרות הכי הרבה, ואת התשובה שלכם. זה חוסך שיחות." />
      {list.length === 0 && <EmptyBox title="עדיין לא הוספתם שאלות" text="שאלה ותשובה קצרה מספיקות." />}
      {list.map((f, i) => {
        const err = errors[`faq-${i}`];
        return (
          <fieldset key={i} className="space-y-3 rounded-2xl border border-gray-300 bg-white p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700">שאלה {i + 1}</legend>
            <TextField label="השאלה" placeholder="לדוגמה: האם אתם מגיעים גם בשבת?" value={f.question} onChange={(v) => update({ faq: setAt(list, i, { question: v }) })} error={!f.question.trim() ? err : undefined} maxLength={200} />
            <TextArea label="התשובה" placeholder="לדוגמה: כן, בתיאום מראש." rows={3} value={f.answer} onChange={(v) => update({ faq: setAt(list, i, { answer: v }) })} error={f.question.trim() ? err : undefined} maxLength={800} />
            <RemoveButton what={`שאלה ${i + 1}`} onClick={() => update({ faq: removeAt(list, i) })} />
          </fieldset>
        );
      })}
      <Button type="button" variant="secondary" disabled={list.length >= 30} onClick={() => update({ faq: [...list, { question: "", answer: "" }] })}>+ הוספת שאלה</Button>
    </div>
  );
}

/* ── Highlights ── */
export function HighlightsStep({ data, update, errors }: StepProps) {
  const list = data.highlights;
  return (
    <div className="space-y-6">
      <StepTitle title="למה לבחור בכם?" subtitle="עד 4 כרטיסים עם מספר או משפט קצר. אתם בוחרים מה לכתוב, ורק דברים שנכונים לגבי העסק." />
      {list.length === 0 && <EmptyBox title="עדיין לא הוספתם כרטיסים" text="לדוגמה: שנות ניסיון, מספר לקוחות, דירוג או תעודות." />}
      {list.map((h, i) => {
        const err = errors[`highlight-${i}`];
        return (
          <fieldset key={i} className="space-y-3 rounded-2xl border border-gray-300 bg-white p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700">כרטיס {i + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
              <TextField label="המספר או הערך" placeholder="לדוגמה: 9" value={h.value} onChange={(v) => update({ highlights: setAt(list, i, { value: v }) })} error={h.label.trim() ? err : undefined} maxLength={30} />
              <TextField label="מה זה אומר?" placeholder="לדוגמה: שנות ניסיון" value={h.label} onChange={(v) => update({ highlights: setAt(list, i, { label: v }) })} error={!h.label.trim() ? err : undefined} maxLength={40} />
            </div>
            <RemoveButton what={`כרטיס ${i + 1}`} onClick={() => update({ highlights: removeAt(list, i) })} />
          </fieldset>
        );
      })}
      <Button type="button" variant="secondary" disabled={list.length >= 4} onClick={() => update({ highlights: [...list, { label: "", value: "" }] })}>+ הוספת כרטיס</Button>
    </div>
  );
}
