import "server-only";
import { randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { sendContactCodeEmail } from "@/lib/email";
import { emailProblem, isIsraeliMobile, normalizeContact, phoneProblem } from "@/lib/field-format";
import { rateLimit } from "@/lib/rate-limit";
import { sendSms, smsAvailable } from "@/lib/sms";
import { hashToken } from "@/lib/tokens";

/**
 * Proving the contact details shown on a site belong to its owner: a 6-digit code sent to the email (or
 * by SMS to the phone), typed back in the editor. Verified values are remembered per site, so publishing
 * can require that every email/phone/WhatsApp number on the site was verified.
 */

export type ContactKind = "EMAIL" | "PHONE";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SENDS_PER_VALUE = { limit: 3, windowMs: 15 * 60 * 1000 };
const SENDS_PER_USER = { limit: 15, windowMs: 60 * 60 * 1000 };
/** SMS costs a message from the package: a tight daily cap per account, plenty for a real owner. */
const SMS_PER_USER_PER_DAY = { limit: 10, windowMs: 24 * 60 * 60 * 1000 };

export interface VerifyResult {
  ok: boolean;
  /** Set when the value is now verified (right away, or by the code). */
  verified?: boolean;
  error?: string;
}

/** Phone verification only exists while an SMS service is available (see lib/sms). */
export const phoneVerificationOn = smsAvailable;

const key = (kind: ContactKind, value: string) => `${kind}:${value}`;

/** Every verified value of a site, as "EMAIL:x" / "PHONE:05..." strings. */
export async function verifiedContacts(websiteId: string): Promise<string[]> {
  const rows = await db.contactVerification.findMany({ where: { websiteId, verifiedAt: { not: null } }, select: { kind: true, value: true } });
  return rows.map((r) => key(r.kind as ContactKind, r.value));
}

/**
 * The contact details a site shows that aren't verified yet, as Hebrew names ("האימייל", "הטלפון",
 * "מספר ה-WhatsApp"). Phones count only while phone verification is available, and only mobile numbers:
 * a landline can't receive an SMS code, so it isn't required (the owner's decision).
 */
export async function unverifiedContacts(websiteId: string, d: { email: string; phone: string; whatsapp: string }): Promise<string[]> {
  const done = new Set(await verifiedContacts(websiteId));
  const missing: string[] = [];
  const email = normalizeContact("EMAIL", d.email);
  if (email && !done.has(key("EMAIL", email))) missing.push("האימייל");
  if (phoneVerificationOn()) {
    const phone = normalizeContact("PHONE", d.phone);
    const wa = normalizeContact("PHONE", d.whatsapp);
    if (isIsraeliMobile(phone) && !done.has(key("PHONE", phone))) missing.push("הטלפון");
    if (isIsraeliMobile(wa) && wa !== phone && !done.has(key("PHONE", wa))) missing.push("מספר ה-WhatsApp");
  }
  return missing;
}

/** Sends a fresh code for `rawValue` (replacing any earlier one). An address the owner already verified for their WEBG account is accepted at once. */
export async function sendContactCode(
  user: { id: string; email: string; emailVerifiedAt: Date | null },
  site: { id: string; businessName: string },
  kind: ContactKind,
  rawValue: string,
): Promise<VerifyResult> {
  const problem = kind === "EMAIL" ? emailProblem(rawValue) : phoneProblem(rawValue);
  const value = normalizeContact(kind, rawValue);
  if (!value || problem) return { ok: false, error: problem ?? "נא למלא קודם את הפרט." };
  if (kind === "PHONE") {
    if (!phoneVerificationOn()) return { ok: false, error: "אימות טלפון עדיין לא זמין." };
    if (!isIsraeliMobile(value)) return { ok: false, error: "קוד ב-SMS אפשר לשלוח רק למספר נייד (שמתחיל ב-05). מספר קווי לא צריך אימות." };
    // A verified account first: fake accounts shouldn't be able to spend the SMS package.
    if (!user.emailVerifiedAt) {
      return { ok: false, error: "כדי לקבל קוד ב-SMS, אמתו קודם את האימייל של חשבון ה-WEBG שלכם. הקישור נשלח אליכם בהרשמה, ואפשר לשלוח אותו שוב מלוח הבקרה." };
    }
  }

  const existing = await db.contactVerification.findUnique({ where: { websiteId_kind_value: { websiteId: site.id, kind, value } } });
  if (existing?.verifiedAt) return { ok: true, verified: true };

  if (kind === "EMAIL" && user.emailVerifiedAt && value === normalizeContact("EMAIL", user.email)) {
    await db.contactVerification.upsert({
      where: { websiteId_kind_value: { websiteId: site.id, kind, value } },
      create: { websiteId: site.id, kind, value, verifiedAt: new Date() },
      update: { verifiedAt: new Date(), codeHash: null, expiresAt: null },
    });
    return { ok: true, verified: true };
  }

  const [okValue, okUser] = await Promise.all([
    rateLimit(`contact-code:${site.id}:${key(kind, value)}`, SENDS_PER_VALUE.limit, SENDS_PER_VALUE.windowMs),
    rateLimit(`contact-code:user:${user.id}`, SENDS_PER_USER.limit, SENDS_PER_USER.windowMs),
  ]);
  if (!okValue || !okUser) return { ok: false, error: "שלחנו כבר כמה קודים. נסו שוב בעוד כמה דקות." };
  if (kind === "PHONE" && !(await rateLimit(`sms-code:user:${user.id}`, SMS_PER_USER_PER_DAY.limit, SMS_PER_USER_PER_DAY.windowMs))) {
    return { ok: false, error: "הגעתם למספר הקודים ב-SMS להיום. אפשר לנסות שוב מחר, או לכתוב לנו אם משהו לא מסתדר." };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const data = { codeHash: hashToken(code), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0 };
  await db.contactVerification.upsert({
    where: { websiteId_kind_value: { websiteId: site.id, kind, value } },
    create: { websiteId: site.id, kind, value, ...data },
    update: data,
  });
  try {
    if (kind === "EMAIL") await sendContactCodeEmail(value, code, site.businessName);
    else await sendSms(value, `קוד האימות שלכם ב-WEBG: ${code}\nבתוקף ל-10 דקות.`);
  } catch (e) {
    console.error("contact code send failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "לא הצלחנו לשלוח את הקוד. נסו שוב בעוד רגע." };
  }
  return { ok: true };
}

/** Checks a typed code. Wrong codes count; after a few, a new code is needed. */
export async function confirmContactCode(siteId: string, kind: ContactKind, rawValue: string, rawCode: string): Promise<VerifyResult> {
  const value = normalizeContact(kind, rawValue);
  const code = rawCode.replace(/\D/g, "");
  const row = await db.contactVerification.findUnique({ where: { websiteId_kind_value: { websiteId: siteId, kind, value } } });
  if (row?.verifiedAt) return { ok: true, verified: true };
  if (!row?.codeHash || !row.expiresAt) return { ok: false, error: "עדיין לא נשלח קוד. לחצו על ״שליחת קוד אימות״." };
  if (row.expiresAt < new Date()) return { ok: false, error: "הקוד פג תוקף. שלחו קוד חדש." };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "יותר מדי ניסיונות. שלחו קוד חדש." };

  const a = Buffer.from(hashToken(code));
  const b = Buffer.from(row.codeHash);
  const match = code.length === 6 && a.length === b.length && timingSafeEqual(a, b);
  if (!match) {
    await db.contactVerification.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "הקוד לא נכון. בדקו ונסו שוב." };
  }
  await db.contactVerification.update({ where: { id: row.id }, data: { verifiedAt: new Date(), codeHash: null, expiresAt: null } });
  return { ok: true, verified: true };
}
