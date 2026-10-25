import "server-only";
import { adminEmailList } from "@/lib/admin-emails";
import { sendSmsBalanceAlert } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { consoleSmsAdapter } from "./console-adapter";
import { SmsSendError, createGlobalSmsAdapter, globalSmsBalance } from "./globalsms-adapter";
import type { SmsAdapter } from "./types";

/**
 * SMS for phone verification codes. Global SMS is used when both GLOBALSMS_API_KEY and SMS_SENDER (the
 * approved sender name, or the account's virtual number) are set. In development without them, the
 * console adapter prints messages instead. In production without them there is no SMS - and then phone
 * verification is off, and not required to publish (see contact-verification.ts).
 */
const LOW_BALANCE = 100;

function provider(): { adapter: SmsAdapter; apiKey: string } | null {
  const apiKey = process.env.GLOBALSMS_API_KEY?.trim();
  const sender = process.env.SMS_SENDER?.trim();
  if (apiKey && sender) return { adapter: createGlobalSmsAdapter(apiKey, sender), apiKey };
  return null;
}

function getAdapter(): SmsAdapter | null {
  const p = provider();
  if (p) return p.adapter;
  return process.env.NODE_ENV === "production" ? null : consoleSmsAdapter;
}

export function smsAvailable(): boolean {
  return getAdapter() !== null;
}

export async function sendSms(to: string, text: string): Promise<void> {
  const adapter = getAdapter();
  if (!adapter) throw new Error("No SMS provider configured");
  try {
    await adapter.send(to, text);
  } catch (e) {
    if (e instanceof SmsSendError && /credit/i.test(e.reason)) await warnLowBalance(0);
    throw e;
  }
  // After a send, check what's left - never holding up the code the owner is waiting for.
  const p = provider();
  if (p) void globalSmsBalance(p.apiKey).then((left) => (left !== null && left < LOW_BALANCE ? warnLowBalance(left) : undefined));
}

/** Emails the WEBG admins that SMS credit is running out - at most once a day. */
async function warnLowBalance(left: number): Promise<void> {
  try {
    const to = adminEmailList();
    if (to.length === 0 || !(await rateLimit("sms-low-balance", 1, 24 * 60 * 60 * 1000))) return;
    await Promise.all(to.map((email) => sendSmsBalanceAlert(email, left)));
  } catch (e) {
    console.error("sms balance alert failed:", e instanceof Error ? e.message : e);
  }
}
