import "server-only";
import { consoleSmsAdapter } from "./console-adapter";
import type { SmsAdapter } from "./types";

/**
 * SMS for phone verification codes. No provider is connected yet (an Israeli provider is planned): adding
 * one means one adapter file next to console-adapter.ts, selected here by its env key - nothing else in
 * the app talks to an SMS service directly.
 *
 * In development the console adapter stands in, so the flow can be tested. In production, without a
 * provider, phone verification is simply not available - and therefore not required to publish.
 */
function getAdapter(): SmsAdapter | null {
  // A real provider will be chosen here, e.g. `if (process.env.SMS_API_KEY) return createXAdapter(...)`.
  return process.env.NODE_ENV === "production" ? null : consoleSmsAdapter;
}

export function smsAvailable(): boolean {
  return getAdapter() !== null;
}

export async function sendSms(to: string, text: string): Promise<void> {
  const adapter = getAdapter();
  if (!adapter) throw new Error("No SMS provider configured");
  await adapter.send(to, text);
}
