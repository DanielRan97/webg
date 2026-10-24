import type { SiteData } from "@/types/site";
import { DAY_NAMES } from "./constants";
import { isValidSlug } from "./slug-format";
import { dateOrderProblem, dateProblem, emailProblem, phoneProblem, priceProblem } from "./field-format";

/** Which error keys belong to which editor step (prefix match). */
export const STEP_ERROR_KEYS: Record<string, string[]> = {
  basics: ["name", "email", "phone", "whatsapp"],
  hours: ["hours-"],
  services: ["service-"],
  images: ["gallery-"],
  delivery: ["delivery-"],
  experience: ["experience-"],
  education: ["education-"],
  certifications: ["certification-"],
  testimonials: ["testimonial-"],
  emergency: ["emergency"],
  booking: ["booking"],
  faq: ["faq-"],
  highlights: ["highlight-"],
  address: ["slug"],
};

/** Field-level problems, in simple Hebrew. Empty object = everything is fine. */
export function validateSite(d: SiteData, opts: { checkSlug?: boolean } = {}): Record<string, string> {
  const e: Record<string, string> = {};
  const on = (t: string) => d.sections.some((s) => s.type === t && s.enabled);

  if (d.businessName.trim().length < 2) e.name = "נא לכתוב את שם העסק (לפחות 2 אותיות).";

  const email = d.email.trim();
  const mail = emailProblem(email);
  if (mail) e.email = mail;

  const phone = phoneProblem(d.phone);
  if (phone) e.phone = phone;
  const wa = phoneProblem(d.whatsapp);
  if (wa) e.whatsapp = wa;

  for (const h of d.hours) {
    if (!h.isOpen) continue;
    if (!h.openTime || !h.closeTime) e[`hours-${h.day}`] = `נא לבחור שעות ליום ${DAY_NAMES[h.day]}, או לסמן אותו כסגור.`;
    else if (h.closeTime <= h.openTime) e[`hours-${h.day}`] = "שעת הסגירה צריכה להיות אחרי שעת הפתיחה.";
  }

  d.services.forEach((s, i) => {
    if (!s.name.trim() && (s.price.trim() || s.description.trim() || s.category.trim())) {
      e[`service-${i}`] = "נא לכתוב שם, או למחוק את השורה.";
    }
    const price = priceProblem(s.price);
    if (price) e[`service-price-${i}`] = price;
  });

  d.gallery.forEach((g, i) => {
    const price = priceProblem(g.price);
    if (price) e[`gallery-price-${i}`] = price;
  });

  if (on("delivery") && d.delivery.available) {
    for (const k of ["fee", "minOrder", "freeOver"] as const) {
      const price = priceProblem(d.delivery[k]);
      if (price) e[`delivery-${k}`] = price;
    }
  }

  if (on("experience")) {
    d.experience.forEach((x, i) => {
      const start = dateProblem(x.startDate);
      const end = dateProblem(x.endDate);
      if (start) e[`experience-start-${i}`] = start;
      if (end) e[`experience-end-${i}`] = end;
      const order = !start && !end && dateOrderProblem(x.startDate, x.endDate);
      if (order) e[`experience-end-${i}`] = order;
    });
  }
  if (on("education")) {
    d.education.forEach((x, i) => {
      const dates = dateProblem(x.dates, { allowRange: true });
      if (dates) e[`education-dates-${i}`] = dates;
    });
  }
  if (on("certifications")) {
    d.certifications.forEach((x, i) => {
      const date = dateProblem(x.date);
      if (date) e[`certification-date-${i}`] = date;
    });
  }

  d.testimonials.forEach((t, i) => {
    const any = t.name.trim() || t.text.trim() || t.imageUrl;
    if (any && !t.name.trim()) e[`testimonial-${i}`] = "נא לכתוב את שם הלקוח.";
    else if (any && !t.text.trim()) e[`testimonial-${i}`] = "נא לכתוב מה הלקוח אמר, או למחוק את ההמלצה.";
  });

  d.faq.forEach((f, i) => {
    if (f.question.trim() && !f.answer.trim()) e[`faq-${i}`] = "נא לכתוב תשובה לשאלה, או למחוק אותה.";
    else if (!f.question.trim() && f.answer.trim()) e[`faq-${i}`] = "נא לכתוב את השאלה.";
  });

  d.highlights.forEach((h, i) => {
    if (h.label.trim() && !h.value.trim()) e[`highlight-${i}`] = "נא לכתוב גם את המספר או הערך.";
    else if (!h.label.trim() && h.value.trim()) e[`highlight-${i}`] = "נא לכתוב מה המספר מייצג.";
  });

  if (on("emergency")) {
    const p = phoneProblem(d.emergency.phone);
    if (p) e["emergency-phone"] = p;
  }

  if (on("booking")) {
    const { method, url } = d.booking;
    if (method === "PHONE" && !d.phone.trim()) e["booking-method"] = "כדי שלקוחות יתקשרו, נא למלא טלפון בשלב ״פרטי העסק״.";
    if (method === "WHATSAPP" && !(d.whatsapp.trim() || d.phone.trim())) e["booking-method"] = "כדי שהלקוחות ישלחו הודעה, נא למלא טלפון או WhatsApp בשלב ״פרטי העסק״.";
    if (method === "LINK") {
      if (!url.trim()) e["booking-url"] = "נא להדביק את הקישור, או לבחור דרך אחרת לקביעת תור.";
      else if (!/^(https?:\/\/)?[^\s]+\.[^\s]+$/i.test(url.trim())) e["booking-url"] = "הקישור לא נראה תקין. לדוגמה: calendly.com/השם-שלכם";
    }
  }

  if (opts.checkSlug && d.slug && !isValidSlug(d.slug)) {
    e.slug = "אפשר להשתמש באותיות באנגלית, מספרים ומקפים, לפחות 3 תווים.";
  }
  return e;
}
