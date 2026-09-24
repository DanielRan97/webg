import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort caller IP for rate limiting. Never trust this for authorization
 * - only for throttling abuse.
 *
 * On Vercel, `x-forwarded-for` is not client-spoofable: Vercel's edge
 * overwrites it with the real connecting IP and does not forward any
 * external value a client sent (see Vercel's Request Headers docs). We still
 * prefer `x-vercel-forwarded-for` when present, since Vercel documents it as
 * the more reliable of the two - identical to `x-forwarded-for` except that
 * it survives untouched even if something in front of Vercel (e.g. a
 * customer-added proxy) rewrites `x-forwarded-for` again afterward.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const vercelFwd = h.get("x-vercel-forwarded-for");
  if (vercelFwd) return vercelFwd.split(",")[0].trim();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
