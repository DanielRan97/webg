/**
 * A card payment gateway, as WEBG's billing uses it (see server/billing.ts): a hosted payment page for the
 * first payment, server-side verification of the owner's return from it, a card token for later charges,
 * and charging that token. Card numbers never reach WEBG.
 */

export interface CheckoutInput {
  /** WEBG's Payment id - comes back on the return from the payment page. */
  orderId: string;
  amountAgorot: number;
  /** Shown on the payment page and on the invoice. */
  description: string;
  /** Who the invoice is made out to (the business name). */
  customerName: string;
  /** Where the invoice is emailed. */
  email: string;
}

export type VerifiedReturn =
  | { ok: true; transId: string; orderId: string; amountAgorot: number; last4: string | null }
  | { ok: false; reason: string };

export interface CardToken {
  token: string;
  /** YYMM */
  expiry: string;
}

export interface ChargeInput extends CheckoutInput, CardToken {}

export type ChargeResult = { ok: true; transId: string } | { ok: false; transId: string | null; code: string };

export interface PaymentGateway {
  /** "HYP" or "FAKE" - stored on the subscription. */
  readonly name: string;
  /** The payment page URL to send the owner to. */
  createCheckoutUrl(input: CheckoutInput): Promise<string>;
  /** Checks with the gateway that the return query string (exactly as received, order kept) is genuine and successful. */
  verifyReturn(rawQuery: string): Promise<VerifiedReturn>;
  /** The token of a successful payment-page transaction, for later charges. */
  getToken(transId: string): Promise<CardToken | null>;
  /** Charges a stored token, with no one present (monthly renewals). */
  chargeToken(input: ChargeInput): Promise<ChargeResult>;
}

/** "50.00" from 5000 agorot - the gateway's amount format. */
export const formatAmount = (agorot: number) => (agorot / 100).toFixed(2);

/** 5000 from "50", "50.0" or "50.00"; null when it isn't a number. */
export function parseAmount(value: string | null): number | null {
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}
