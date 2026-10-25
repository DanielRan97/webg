import "server-only";
import type { SmsAdapter } from "./types";

/**
 * Global SMS (globalsms.co.il; API host api.itnewsletter.co.il). Sending posts JSON with the key in
 * the body; success answers with the number of credits used, failure with a short text such as
 * "invalid login", "Unapporved originator number" (sic) or "Not enough credit". Always over HTTPS.
 *
 * The balance endpoint takes the key in the query string - that URL must never be logged.
 */
const BASE = "https://api.itnewsletter.co.il/api/restApiSms";
const TIMEOUT_MS = 10_000;

/** A failed send, with the provider's own reason (safe to log: it never contains the key). */
export class SmsSendError extends Error {
  constructor(readonly reason: string) {
    super(`Global SMS: ${reason}`);
  }
}

export function createGlobalSmsAdapter(apiKey: string, sender: string): SmsAdapter {
  return {
    async send(to, text) {
      const res = await fetch(`${BASE}/sendSmsToRecipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ApiKey: apiKey, txtOriginator: sender, destinations: to, txtSMSmessage: text }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (!res.ok) throw new SmsSendError(`HTTP ${res.status}`);
      const body = (await res.text()).trim();
      // Success is the number of credits charged; anything else is the provider's error text.
      if (body === "" || Number.isNaN(Number(body))) throw new SmsSendError(body.slice(0, 120) || "empty response");
    },
  };
}

/** Messages left in the account, or null if the balance can't be read right now. */
export async function globalSmsBalance(apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/getBalance?ApiKey=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    if (!res.ok) return null;
    const n = Number((await res.text()).trim());
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
