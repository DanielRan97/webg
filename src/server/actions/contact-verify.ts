"use server";

import { requireUser } from "@/lib/session";
import { confirmContactCode, sendContactCode, type ContactKind, type VerifyResult } from "../contact-verification";
import { getOwnedWebsite } from "../websites";

const KINDS: readonly string[] = ["EMAIL", "PHONE"];

/** "שליחת קוד אימות" next to the site's email / phone / WhatsApp field. Owner-only. */
export async function sendContactCodeAction(siteId: string, kind: ContactKind, value: string): Promise<VerifyResult> {
  if (!KINDS.includes(kind)) return { ok: false, error: "בקשה לא תקינה." };
  const user = await requireUser();
  const site = await getOwnedWebsite(user.id, siteId);
  if (!site) return { ok: false, error: "האתר לא נמצא" };
  return sendContactCode(user, { id: site.id, businessName: site.data.businessName }, kind, value);
}

/** The code the owner typed back. Owner-only. */
export async function confirmContactCodeAction(siteId: string, kind: ContactKind, value: string, code: string): Promise<VerifyResult> {
  if (!KINDS.includes(kind)) return { ok: false, error: "בקשה לא תקינה." };
  const user = await requireUser();
  const site = await getOwnedWebsite(user.id, siteId);
  if (!site) return { ok: false, error: "האתר לא נמצא" };
  return confirmContactCode(site.id, kind, value, code);
}
