import "server-only";
import type { SmsAdapter } from "./types";

/**
 * Global SMS (globalsms.co.il). WEBG runs on Vercel with no fixed IP, so it uses the host without IP
 * protection, sapi.itnewsletter.co.il (api.itnewsletter.co.il only accepts approved IPs - it answers
 * 403 before checking the key). Sending posts JSON with the key in the body. That host answers
 * {"success":true,"result":<credits>,...} or {"success":false,...,"errDesc":"e 1"}; the plain-text
 * answers of the documentation (a number, or "invalid login" / "Not enough credit" / ...) are
 * understood too. Always over HTTPS.
 *
 * The balance endpoint takes the key in the query string - that URL must never be logged.
 */
const BASE = "https://sapi.itnewsletter.co.il/api/restApiSms";

/** Reads either answer format: JSON ({ success, result, errDesc }) or a bare number / error text. */
function parseAnswer(raw: string): { ok: boolean; value: number | null; error: string } {
  const body = raw.trim();
  try {
    const j = JSON.parse(body) as { success?: unknown; result?: unknown; errDesc?: unknown };
    if (j && typeof j === "object" && "success" in j) {
      const value = Number(j.result);
      return { ok: j.success === true, value: Number.isFinite(value) ? value : null, error: String(j.errDesc ?? "").slice(0, 120) || "failed" };
    }
  } catch {
    // Not JSON: the plain-text format.
  }
  const value = Number(body);
  const ok = body !== "" && Number.isFinite(value);
  return { ok, value: ok ? value : null, error: body.slice(0, 120) || "empty response" };
}

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
      const answer = parseAnswer(await res.text());
      if (!answer.ok) throw new SmsSendError(answer.error);
    },
  };
}

/** Messages left in the account, or null if the balance can't be read right now. */
export async function globalSmsBalance(apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/getBalance?ApiKey=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    if (!res.ok) return null;
    const answer = parseAnswer(await res.text());
    return answer.ok ? answer.value : null;
  } catch {
    return null;
  }
}
