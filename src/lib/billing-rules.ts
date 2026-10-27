import { PLANS } from "./business";
import { PLAN, SUBSCRIPTION_STATUS, type Plan } from "./constants";

/**
 * The rules of WEBG's billing, free of the database so they can be tested on their own (server/billing.ts
 * applies them). Monthly cycles; a failed renewal is retried on days 3 and 7 of a 7-day grace, after which
 * the site stops showing. Prices come from PLANS (whole shekels, final - WEBG is an exempt dealer, no VAT).
 */

export const GRACE_DAYS = 7;
/** Days after the first failure on which the renewal is tried again. The last one ends the grace. */
export const RETRY_DAYS = [3, GRACE_DAYS] as const;
/** Days before a free period ends on which an owner with no card on file is reminded. */
export const CARD_REMINDER_DAYS = [7, 1] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function priceAgorot(plan: string): number {
  const p = PLANS.find((x) => x.id === plan) ?? PLANS.find((x) => x.id === PLAN.BASIC)!;
  return p.price * 100;
}

/** The same day of the next month(s); the 31st becomes the month's last day (31 Jan -> 28/29 Feb). */
export function addMonths(date: Date, months = 1): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

/**
 * Upgrading Basic -> Pro mid-month with a card on file: the price difference for the days left in the paid
 * period, in agorot (whole shekels, rounded). Zero when the period is over or nearly over.
 */
export function upgradeDifferenceAgorot(from: Plan | string, to: Plan | string, now: Date, periodEnd: Date, periodStart: Date): number {
  const diff = priceAgorot(to) - priceAgorot(from);
  const total = periodEnd.getTime() - periodStart.getTime();
  const left = periodEnd.getTime() - now.getTime();
  if (diff <= 0 || total <= 0 || left <= 0) return 0;
  return Math.round((diff * Math.min(1, left / total)) / 100) * 100;
}

/** Whether a PAST_DUE subscription is due for its next retry (`failedAttempts` failures so far, the first at `pastDueSince`). */
export function retryDue(failedAttempts: number, pastDueSince: Date, now: Date): boolean {
  const day = RETRY_DAYS[failedAttempts - 1];
  return day !== undefined && now.getTime() >= addDays(pastDueSince, day).getTime();
}

/** Whether a failure after `failedAttempts` earlier failures ends the grace (the site stops showing). */
export const graceOver = (failedAttemptsIncludingThis: number) => failedAttemptsIncludingThis > RETRY_DAYS.length;

/** Which reminder (days before the end) is due for a free period ending at `end`, or null. One per window. */
export function cardReminderDue(end: Date, now: Date, remindedAt: Date | null): number | null {
  const daysLeft = (end.getTime() - now.getTime()) / DAY_MS;
  for (const d of [...CARD_REMINDER_DAYS].sort((a, b) => a - b)) {
    if (daysLeft <= d && daysLeft > 0) {
      const windowStart = addDays(end, -d);
      return remindedAt && remindedAt.getTime() >= windowStart.getTime() ? null : d;
    }
  }
  return null;
}

/**
 * Where a month just paid through the payment page ends. Paid during a free period (an existing site's free
 * launch month), it starts when the free period ends, so paying early loses no free days.
 */
export function paidPeriodEnd(now: Date, current: { status: string; currentPeriodEnd: Date | null } | null): Date {
  const freeUntil = current?.status === SUBSCRIPTION_STATUS.TRIAL ? current.currentPeriodEnd : null;
  return addMonths(freeUntil && freeUntil > now ? freeUntil : now);
}
