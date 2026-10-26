import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { formatAmount, parseAmount, type PaymentGateway } from "./types";

/**
 * A stand-in for HYP in development and tests (PAYMENTS_FAKE=1, never in production): the "payment page" is
 * /dev/fake-hyp, which returns to /api/billing/return with HYP's parameters and an HMAC signature that
 * verifyReturn checks, like HYP's VERIFY. No money, no card data.
 *
 * The page can approve a card whose later charges are declined ("declinelater" in the transaction id, kept in
 * the token), to exercise failed renewals and the grace period.
 */
const SECRET = process.env.PAYMENTS_FAKE_SECRET || "webg-fake-hyp-dev-only";

const sign = (parts: string[]) => createHmac("sha256", SECRET).update(parts.join("|")).digest("hex");

function sameSig(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export type FakeCard = "ok" | "declinelater";

/** The return URL the fake page sends the owner to (used by app/dev/fake-hyp). */
export function fakeReturnQuery(orderId: string, amount: string, card: FakeCard): string {
  const id = `fake-${card}-${randomBytes(4).toString("hex")}`;
  const params = { Id: id, CCode: "0", Amount: amount, Order: orderId, L4digit: card === "ok" ? "4242" : "0002" };
  const Sign = sign([params.Id, params.CCode, params.Amount, params.Order]);
  return new URLSearchParams({ ...params, Sign }).toString();
}

/** Checks the checkout link's own signature, so the fake page only shows real checkouts. */
export function fakeCheckoutValid(orderId: string, amount: string, sig: string): boolean {
  return sameSig(sign(["checkout", orderId, amount]), sig);
}

export const fakeGateway: PaymentGateway = {
  name: "FAKE",

  async createCheckoutUrl(input) {
    const amount = formatAmount(input.amountAgorot);
    const q = new URLSearchParams({ Order: input.orderId, Amount: amount, desc: input.description, sig: sign(["checkout", input.orderId, amount]) });
    return `/dev/fake-hyp?${q}`;
  },

  async verifyReturn(rawQuery) {
    const p = new URLSearchParams(rawQuery);
    const [id, code, amount, order, s] = ["Id", "CCode", "Amount", "Order", "Sign"].map((k) => p.get(k) ?? "");
    if (code !== "0") return { ok: false, reason: `CCode ${code}` };
    if (!sameSig(sign([id, code, amount, order]), s)) return { ok: false, reason: "bad signature" };
    const amountAgorot = parseAmount(amount);
    if (!id || !order || amountAgorot === null) return { ok: false, reason: "missing parameters" };
    return { ok: true, transId: id, orderId: order, amountAgorot, last4: p.get("L4digit") };
  },

  async getToken(transId) {
    if (!transId.startsWith("fake-")) return null;
    return { token: `tok-${transId}`, expiry: "3012" };
  },

  async chargeToken(input) {
    const transId = `fake-charge-${randomBytes(4).toString("hex")}`;
    // "6": declined by the card company.
    return input.token.includes("declinelater") ? { ok: false, transId, code: "6" } : { ok: true, transId };
  },
};
