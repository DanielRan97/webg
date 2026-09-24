import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, saveUploadedImage } from "@/lib/storage";

/**
 * This is the one mutating endpoint in the app that is a plain Route Handler
 * rather than a Server Action, so it does not get Next.js's built-in
 * Origin/Host check for Server Actions - it needs its own CSRF reasoning:
 *
 * - Auth is required (`getCurrentUser()` below), and auth is cookie-based
 *   (`webg_session`), so a forged cross-site request only matters if the
 *   browser would attach that cookie to it.
 * - The cookie is set with `sameSite: "lax"` (see session.ts). Lax cookies
 *   are withheld on cross-site subrequests, including a cross-site
 *   `<form method="POST">` auto-submit - the classic CSRF vector - and are
 *   only sent on top-level GET navigation. A third-party page cannot trigger
 *   an authenticated POST here.
 * - No separate CSRF token is added on top of that: it would be redundant
 *   defense for a same-site-cookie-gated, auth-required upload endpoint with
 *   no state-changing GET route, and this app has no cross-origin frontend
 *   that would need one.
 */
export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  if (!(file.type in ALLOWED_TYPES)) {
    return NextResponse.json({ error: "אפשר להעלות רק תמונות (PNG, JPG, WEBP, GIF)" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "התמונה גדולה מדי (עד 5MB)" }, { status: 400 });
  }

  const result = await saveUploadedImage(Buffer.from(await file.arrayBuffer()), file.type);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ url: result.url });
}
