import "server-only";
import { formatAmount, parseAmount, type PaymentGateway } from "./types";

/**
 * HYP Pay (pay.hyp.co.il, formerly YaadPay) - https://developers.hyp.co.il/pay. Every call is a GET to one
 * endpoint with the terminal (Masof), API key (KEY) and API password (PassP) in the query string, so URLs
 * must never be logged. Answers are URL-encoded strings with a status code `CCode` ("0" = success); HTTP is
 * 200 even on errors, and an HTML answer means a system error.
 *
 * The page's success redirect goes to the URL set in the HYP portal (Settings > Payment Page and API):
 * it must be https://<app>/api/billing/return. Errors stay on HYP's page, where the owner can try again.
 */
const ENDPOINT = "https://pay.hyp.co.il/p/";
const TIMEOUT_MS = 20_000;
/** Terminals that don't require an Israeli ID take this placeholder (we never collect IDs). */
const NO_ID = "000000000";

export class HypError extends Error {
  constructor(readonly code: string, what: string) {
    super(`HYP ${what} failed (CCode ${code})`);
  }
}

export function parseAnswer(body: string): URLSearchParams {
  const text = body.trim();
  if (!text || text.startsWith("<")) return new URLSearchParams({ CCode: "html" });
  return new URLSearchParams(text);
}

export function createHypGateway(cfg: { masof: string; key: string; passP: string }): PaymentGateway {
  async function call(params: Record<string, string>, extraQuery = ""): Promise<{ raw: string; answer: URLSearchParams }> {
    const query = new URLSearchParams({ ...params, Masof: cfg.masof, PassP: cfg.passP }).toString() + (extraQuery ? `&${extraQuery}` : "");
    const res = await fetch(`${ENDPOINT}?${query}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    const raw = await res.text();
    return { raw: raw.trim(), answer: parseAnswer(raw) };
  }

  return {
    name: "HYP",

    async createCheckoutUrl(input) {
      const { raw, answer } = await call({
        action: "APISign",
        What: "SIGN",
        KEY: cfg.key,
        Sign: "True",
        UTF8: "True",
        UTF8out: "True",
        PageLang: "HEB",
        Amount: formatAmount(input.amountAgorot),
        Order: input.orderId,
        Info: input.description,
        heshDesc: input.description,
        ClientName: input.customerName,
        email: input.email,
        SendHesh: "True",
        MoreData: "True",
        Tash: "1",
      });
      // Success is the signed parameter set for the page (it has a signature and no CCode).
      if (!answer.get("signature")) throw new HypError(answer.get("CCode") ?? "?", "APISign SIGN");
      return `${ENDPOINT}?${raw}`;
    },

    async verifyReturn(rawQuery) {
      const received = new URLSearchParams(rawQuery);
      if (received.get("CCode") !== "0") return { ok: false, reason: `CCode ${received.get("CCode")}` };
      const transId = received.get("Id");
      const orderId = received.get("Order");
      const amountAgorot = parseAmount(received.get("Amount"));
      if (!transId || !orderId || amountAgorot === null) return { ok: false, reason: "missing parameters" };
      // HYP checks the signature against every parameter it sent, in the same order.
      const { answer } = await call({ action: "APISign", What: "VERIFY", KEY: cfg.key }, rawQuery);
      if (answer.get("CCode") !== "0") return { ok: false, reason: `VERIFY CCode ${answer.get("CCode")}` };
      return { ok: true, transId, orderId, amountAgorot, last4: received.get("L4digit") };
    },

    async getToken(transId) {
      const { answer } = await call({ action: "getToken", TransId: transId });
      const token = answer.get("Token");
      const expiry = answer.get("Tokef");
      if (answer.get("CCode") !== "0" || !token || !expiry) return null;
      return { token, expiry };
    },

    async chargeToken(input) {
      const { answer } = await call({
        action: "soft",
        Token: "True",
        CC: input.token,
        Tmonth: input.expiry.slice(2, 4),
        Tyear: input.expiry.slice(0, 2),
        UserId: NO_ID,
        Amount: formatAmount(input.amountAgorot),
        Order: input.orderId,
        Info: input.description,
        heshDesc: input.description,
        ClientName: input.customerName,
        email: input.email,
        SendHesh: "True",
        UTF8: "True",
        UTF8out: "True",
      });
      const code = answer.get("CCode") ?? "?";
      const transId = answer.get("Id");
      return code === "0" && transId ? { ok: true, transId } : { ok: false, transId, code };
    },
  };
}
