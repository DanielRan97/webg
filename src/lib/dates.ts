/**
 * Dates and times as Israeli users read them, always in Israel time. The zone is fixed on purpose: the
 * server (UTC on Vercel) and the browser must produce the same text, or React reports a hydration
 * mismatch (#418) and the times shown would be hours off.
 */
const TIME_ZONE = "Asia/Jerusalem";

const dateTime = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: TIME_ZONE });
const dateOnly = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeZone: TIME_ZONE });

export const formatDateTime = (d: Date | string) => dateTime.format(new Date(d));
export const formatDate = (d: Date | string) => dateOnly.format(new Date(d));
