import "server-only";
import { fakeGateway } from "./fake";
import { createHypGateway } from "./hyp";
import type { PaymentGateway } from "./types";

/**
 * Which gateway takes payments: HYP when its three settings are set (Vercel only - never in code or chat),
 * the fake one in development with PAYMENTS_FAKE=1, otherwise none. With none, billing is off and WEBG
 * behaves as before payments existed: publishing and Pro cost nothing.
 */
export function getGateway(): PaymentGateway | null {
  const masof = process.env.HYP_MASOF?.trim();
  const key = process.env.HYP_KEY?.trim();
  const passP = process.env.HYP_PASSP?.trim();
  if (masof && key && passP) return createHypGateway({ masof, key, passP });
  if (process.env.PAYMENTS_FAKE === "1" && process.env.NODE_ENV !== "production") return fakeGateway;
  return null;
}

export const billingEnabled = () => getGateway() !== null;

export * from "./types";
