import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort caller IP for rate limiting. Behind Vercel/most proxies,
 * `x-forwarded-for` holds the real client first, then any intermediate
 * proxies. Never trust this for authorization - only for throttling abuse.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
