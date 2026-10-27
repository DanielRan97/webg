import "server-only";
import { db } from "@/lib/db";
import { addMonths, cardReminderDue, GRACE_DAYS, graceOver, launchFreeUntil, paidPeriodEnd, priceAgorot, retryDue, upgradeDifferenceAgorot, addDays } from "@/lib/billing-rules";
import { PLAN, SUBSCRIPTION_STATUS, WEBSITE_STATUS, type Plan, type SubscriptionStatus } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { sendBillingNoticeEmail } from "@/lib/email";
import type { BillingNotice } from "@/lib/email/templates";
import { appUrl } from "@/lib/env";
import { formatAmount, getGateway, type PaymentGateway } from "@/lib/payments";

/**
 * WEBG's monthly billing, run by WEBG itself (not HYP's standing orders, which can't tell us about a failed
 * month). The first payment goes through the gateway's payment page and leaves a card token; every month the
 * daily job (/api/cron/billing) charges it. A failed charge starts a 7-day grace (site still shown, owner
 * emailed, retried on days 3 and 7); after it the site stops showing - nothing is deleted.
 *
 * Off (all of it) while no gateway is configured: then publishing and Pro cost nothing, as before payments.
 */

export type CheckoutPurpose = "PUBLISH" | "UPGRADE" | "CARD";

type SiteForBilling = { id: string; businessName: string; plan: string; userId: string };

const billingPageUrl = (websiteId: string) => `${appUrl()}/sites/${websiteId}/billing`;
const describe = (site: { businessName: string }, plan: string) => `WEBG ${plan === PLAN.PRO ? "Pro" : "Basic"} - ${site.businessName} - מנוי חודשי`;

/** Sets the subscription status and its cache on the website together. */
async function setStatus(websiteId: string, status: SubscriptionStatus, data: Record<string, unknown> = {}) {
  await db.$transaction([
    db.subscription.upsert({ where: { websiteId }, create: { websiteId, status, ...data }, update: { status, ...data } }),
    db.website.update({ where: { id: websiteId }, data: { subscriptionStatus: status } }),
  ]);
}

async function notify(kind: BillingNotice, site: { id: string; businessName: string; plan: string; userId: string }, date: Date | null) {
  const owner = await db.user.findUnique({ where: { id: site.userId }, select: { email: true } });
  if (!owner) return;
  try {
    await sendBillingNoticeEmail(owner.email, kind, {
      businessName: site.businessName,
      url: billingPageUrl(site.id),
      amount: formatAmount(priceAgorot(site.plan)).replace(/\.00$/, ""),
      date: date ? formatDate(date) : "",
    });
  } catch (e) {
    console.error("billing email failed:", e instanceof Error ? e.message : e);
  }
}

/** Whether this site has a usable card on file and a paid period running (so publishing needs no new payment). */
export async function hasPaidPeriod(websiteId: string, now = new Date()): Promise<boolean> {
  const sub = await db.subscription.findUnique({ where: { websiteId } });
  return Boolean(sub && sub.status === SUBSCRIPTION_STATUS.ACTIVE && sub.currentPeriodEnd && sub.currentPeriodEnd > now);
}

/**
 * Starts a payment-page checkout and returns the URL to send the owner to. The amount is decided here,
 * never by the browser: PUBLISH and CARD charge a month of `plan`, UPGRADE a month of Pro.
 */
export async function startCheckout(site: SiteForBilling, email: string, purpose: CheckoutPurpose, plan: Plan, gateway: PaymentGateway): Promise<string> {
  const chargePlan = purpose === "UPGRADE" ? PLAN.PRO : plan;
  const amountAgorot = priceAgorot(chargePlan);
  const description = describe(site, chargePlan);
  const payment = await db.payment.create({
    data: { websiteId: site.id, userId: site.userId, kind: "CHECKOUT", purpose, plan: chargePlan, amountAgorot, description },
  });
  return gateway.createCheckoutUrl({ orderId: payment.id, amountAgorot, description, customerName: site.businessName, email });
}

export type CheckoutOutcome = { ok: true; websiteId: string; purpose: CheckoutPurpose } | { ok: false; websiteId: string | null; reason: string };

/**
 * The owner is back from the payment page. Verifies it with the gateway, then (once - a repeated return is
 * harmless) records the payment, stores the card and applies what was paid for. Nothing is trusted from the
 * browser: the order id leads to WEBG's own pending payment, and the paid amount must match it.
 */
export async function completeCheckout(rawQuery: string, gateway: PaymentGateway, now = new Date()): Promise<CheckoutOutcome> {
  const verified = await gateway.verifyReturn(rawQuery);
  if (!verified.ok) return { ok: false, websiteId: null, reason: verified.reason };
  const payment = await db.payment.findUnique({ where: { id: verified.orderId } });
  if (!payment || payment.kind !== "CHECKOUT" || !payment.websiteId) return { ok: false, websiteId: null, reason: "unknown order" };
  const purpose = payment.purpose as CheckoutPurpose;
  if (payment.status === "PAID") return { ok: true, websiteId: payment.websiteId, purpose };
  if (verified.amountAgorot !== payment.amountAgorot) return { ok: false, websiteId: payment.websiteId, reason: "amount mismatch" };

  // Claim the payment: only one request gets to apply it.
  const { count } = await db.payment.updateMany({
    where: { id: payment.id, status: "PENDING" },
    data: { status: "PAID", paidAt: now, providerTransId: verified.transId, providerCode: "0" },
  });
  if (count === 0) return { ok: true, websiteId: payment.websiteId, purpose };

  const card = await gateway.getToken(verified.transId);
  if (!card) console.error(`billing: no card token for payment ${payment.id} - the next renewal will ask for a card`);
  const websiteId = payment.websiteId;
  const current = await db.subscription.findUnique({ where: { websiteId }, select: { status: true, currentPeriodEnd: true } });
  await setStatus(websiteId, SUBSCRIPTION_STATUS.ACTIVE, {
    currentPeriodEnd: paidPeriodEnd(now, current),
    provider: gateway.name,
    cardToken: card?.token ?? null,
    cardExpiry: card?.expiry ?? null,
    cardLast4: verified.last4 ?? card?.token.slice(-4) ?? null,
    failedAttempts: 0,
    pastDueSince: null,
    cancelAtPeriodEnd: false,
    remindedAt: null,
  });
  if (purpose === "PUBLISH") {
    await db.website.update({ where: { id: websiteId }, data: { plan: payment.plan, status: WEBSITE_STATUS.PUBLISHED } });
  } else if (purpose === "UPGRADE") {
    await db.website.update({ where: { id: websiteId }, data: { plan: PLAN.PRO } });
  }
  return { ok: true, websiteId, purpose };
}

/**
 * Basic -> Pro on a site with a card and a paid period: charges the difference for the days left now
 * (no payment page), and the next renewal is at the Pro price. Returns null when the site has no card on
 * file - then the upgrade goes through the payment page instead.
 */
export async function upgradeWithCardOnFile(site: SiteForBilling, email: string, gateway: PaymentGateway, now = new Date()): Promise<{ ok: boolean; error?: string } | null> {
  const sub = await db.subscription.findUnique({ where: { websiteId: site.id } });
  if (!sub?.cardToken || !sub.cardExpiry || sub.status !== SUBSCRIPTION_STATUS.ACTIVE || !sub.currentPeriodEnd || sub.currentPeriodEnd <= now) return null;
  const amountAgorot = upgradeDifferenceAgorot(site.plan, PLAN.PRO, now, sub.currentPeriodEnd, addMonths(sub.currentPeriodEnd, -1));
  if (amountAgorot > 0) {
    const description = `${describe(site, PLAN.PRO)} - הפרש שדרוג`;
    const payment = await db.payment.create({
      data: { websiteId: site.id, userId: site.userId, kind: "RENEWAL", purpose: "UPGRADE", plan: PLAN.PRO, amountAgorot, description },
    });
    const res = await gateway.chargeToken({ token: sub.cardToken, expiry: sub.cardExpiry, orderId: payment.id, amountAgorot, description, customerName: site.businessName, email });
    await db.payment.update({
      where: { id: payment.id },
      data: res.ok ? { status: "PAID", paidAt: now, providerTransId: res.transId, providerCode: "0" } : { status: "FAILED", providerTransId: res.transId, providerCode: res.code },
    });
    if (!res.ok) return { ok: false, error: "החיוב בכרטיס השמור לא אושר. אפשר לשדרג עם כרטיס אחר." };
  }
  await db.website.update({ where: { id: site.id }, data: { plan: PLAN.PRO } });
  return { ok: true };
}

/** The owner cancels: no more charges; the site stays live until the paid period ends. `false` undoes it. A cancellation is confirmed by email. */
export async function setCancelAtPeriodEnd(site: SiteForBilling, cancel: boolean) {
  const sub = await db.subscription.update({ where: { websiteId: site.id }, data: { cancelAtPeriodEnd: cancel } });
  if (cancel) await notify("CANCELLED", site, sub.currentPeriodEnd);
}

export interface RenewalReport {
  charged: number;
  failed: number;
  suspended: number;
  ended: number;
  reminded: number;
}

/**
 * The daily job: renews every subscription whose period has ended, retries failed ones on their days, ends
 * cancelled ones, and reminds owners in a free period with no card. Safe to run more than once a day: each
 * step only acts on rows that are still due.
 */
export async function runBilling(gateway: PaymentGateway, now = new Date()): Promise<RenewalReport> {
  const report: RenewalReport = { charged: 0, failed: 0, suspended: 0, ended: 0, reminded: 0 };
  const due = await db.subscription.findMany({
    where: {
      OR: [
        { status: { in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL] }, currentPeriodEnd: { lte: now } },
        { status: SUBSCRIPTION_STATUS.PAST_DUE },
      ],
    },
    include: { website: { select: { id: true, businessName: true, plan: true, userId: true, user: { select: { email: true } } } } },
  });

  for (const sub of due) {
    const site = sub.website;
    try {
      // Cancelled by the owner, or a free period ending with no card: the site stops showing. (A paying site
      // whose card token is missing goes through the failed-charge path below: grace, emails, a new card.)
      if (sub.cancelAtPeriodEnd || (sub.status === SUBSCRIPTION_STATUS.TRIAL && !sub.cardToken)) {
        await setStatus(site.id, SUBSCRIPTION_STATUS.INACTIVE, { cancelAtPeriodEnd: false });
        await notify(sub.cancelAtPeriodEnd ? "SUBSCRIPTION_ENDED" : "FREE_PERIOD_ENDED", site, null);
        report.ended++;
        continue;
      }
      if (sub.status === SUBSCRIPTION_STATUS.PAST_DUE && !(sub.pastDueSince && retryDue(sub.failedAttempts, sub.pastDueSince, now))) continue;

      const amountAgorot = priceAgorot(site.plan);
      const description = describe(site, site.plan);
      const payment = await db.payment.create({
        data: { websiteId: site.id, userId: site.userId, kind: "RENEWAL", purpose: "RENEWAL", plan: site.plan, amountAgorot, description },
      });
      const res = sub.cardToken && sub.cardExpiry
        ? await gateway.chargeToken({ token: sub.cardToken, expiry: sub.cardExpiry, orderId: payment.id, amountAgorot, description, customerName: site.businessName, email: site.user.email })
        : ({ ok: false, transId: null, code: "no-card" } as const);

      if (res.ok) {
        await db.payment.update({ where: { id: payment.id }, data: { status: "PAID", paidAt: now, providerTransId: res.transId, providerCode: "0" } });
        // The next period follows the one just paid, even when paid late in the grace.
        await setStatus(site.id, SUBSCRIPTION_STATUS.ACTIVE, { currentPeriodEnd: addMonths(sub.currentPeriodEnd ?? now), failedAttempts: 0, pastDueSince: null });
        report.charged++;
        continue;
      }

      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerTransId: res.transId, providerCode: res.code } });
      const attempts = sub.status === SUBSCRIPTION_STATUS.PAST_DUE ? sub.failedAttempts + 1 : 1;
      const pastDueSince = sub.pastDueSince ?? now;
      if (graceOver(attempts)) {
        await setStatus(site.id, SUBSCRIPTION_STATUS.INACTIVE, { failedAttempts: attempts });
        await notify("SITE_SUSPENDED", site, null);
        report.suspended++;
      } else {
        await setStatus(site.id, SUBSCRIPTION_STATUS.PAST_DUE, { failedAttempts: attempts, pastDueSince });
        await notify(attempts === 1 ? "PAYMENT_FAILED" : "PAYMENT_RETRY_FAILED", site, addDays(pastDueSince, GRACE_DAYS));
        report.failed++;
      }
    } catch (e) {
      // One site's problem must not stop the others; the next run tries it again.
      console.error(`billing: renewal of ${site.id} failed:`, e instanceof Error ? e.message : e);
    }
  }

  // Free periods ending soon with no card on file: remind, once per window.
  const soon = await db.subscription.findMany({
    where: { status: SUBSCRIPTION_STATUS.TRIAL, cardToken: null, currentPeriodEnd: { gt: now, lte: addDays(now, 7) } },
    include: { website: { select: { id: true, businessName: true, plan: true, userId: true, status: true } } },
  });
  for (const sub of soon) {
    if (sub.website.status !== WEBSITE_STATUS.PUBLISHED || !sub.currentPeriodEnd) continue;
    if (cardReminderDue(sub.currentPeriodEnd, now, sub.remindedAt) === null) continue;
    await db.subscription.update({ where: { id: sub.id }, data: { remindedAt: now } });
    await notify("CARD_NEEDED", sub.website, sub.currentPeriodEnd);
    report.reminded++;
  }
  return report;
}

/**
 * Sites from before billing: published, showing, no card and no period - the daily job never touches them,
 * so they would stay free forever. The launch gives each a free month from now (then the usual reminders,
 * and the site stops showing at the end unless a card was added).
 */
const launchWhere = {
  status: WEBSITE_STATUS.PUBLISHED,
  subscriptionStatus: { in: [SUBSCRIPTION_STATUS.TRIAL, SUBSCRIPTION_STATUS.ACTIVE] },
  OR: [{ subscription: null }, { subscription: { cardToken: null, currentPeriodEnd: null } }],
};

export async function listLaunchCandidates() {
  return db.website.findMany({
    where: launchWhere,
    select: { id: true, businessName: true, slug: true, plan: true, user: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Starts the free month for every candidate and emails its owner. Each site is claimed with a conditional
 * update, so running it twice (or two admins at once) never restarts a month or sends a second email.
 */
export async function startLaunchFreeMonth(now = new Date()): Promise<{ started: number }> {
  const end = launchFreeUntil(now);
  const sites = await db.website.findMany({ where: launchWhere, select: { id: true, businessName: true, plan: true, userId: true } });
  let started = 0;
  for (const site of sites) {
    try {
      // Rows from before subscriptions existed get one first (still without a period, so the claim below applies).
      await db.subscription.upsert({ where: { websiteId: site.id }, create: { websiteId: site.id }, update: {} });
      const { count } = await db.subscription.updateMany({
        where: { websiteId: site.id, cardToken: null, currentPeriodEnd: null },
        data: { status: SUBSCRIPTION_STATUS.TRIAL, currentPeriodEnd: end, remindedAt: null },
      });
      if (count === 0) continue;
      await db.website.update({ where: { id: site.id }, data: { subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL } });
      await notify("BILLING_STARTS", site, end);
      started++;
    } catch (e) {
      console.error(`billing launch: ${site.id} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return { started };
}

export { getGateway };
