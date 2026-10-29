import "server-only";

/**
 * Cloudflare Turnstile for the public site forms - a "not a robot" check that usually needs no click.
 * On only when both keys are set (NEXT_PUBLIC_TURNSTILE_SITE_KEY for the widget, TURNSTILE_SECRET_KEY
 * here); without them the forms rely on lib/form-guard alone.
 */
const ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

/**
 * Whether Cloudflare vouches for this submission's token. A missing or rejected token fails. If
 * Cloudflare itself can't be reached, the submission goes through (logged): an outage there must not
 * silently cost a business its leads, and the other checks still apply.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileEnabled() || !secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);
  try {
    const res = await fetch(ENDPOINT, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("turnstile check unavailable, letting the submission through:", e instanceof Error ? e.message : e);
    return true;
  }
}
