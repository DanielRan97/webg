import "server-only";
import { localAdapter, readLocalImage } from "./local";
import { r2Adapter } from "./r2";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, sniffImageMime } from "./shared";
import type { StorageAdapter } from "./types";

export { ALLOWED_TYPES, MAX_UPLOAD_BYTES, readLocalImage };

function hasR2Config(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME && process.env.R2_PUBLIC_URL,
  );
}

function adapter(): StorageAdapter {
  return hasR2Config() ? r2Adapter : localAdapter;
}

/** True in the environment actually serving requests right now - used by the /api/files route to know whether it should even try. */
export function usingLocalStorage(): boolean {
  return !hasR2Config();
}

export type SaveImageResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * The one place an upload is accepted: validates size, validates the
 * declared type, and - the important part - re-derives the real type from
 * the file's own bytes rather than trusting the Content-Type a client sent,
 * before handing it to whichever adapter is active (local disk in dev, R2
 * in production).
 */
export async function saveUploadedImage(bytes: Buffer, declaredMime: string): Promise<SaveImageResult> {
  if (bytes.length === 0) return { ok: false, error: "הקובץ ריק" };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: "התמונה גדולה מדי (עד 5MB)" };
  if (!(declaredMime in ALLOWED_TYPES)) return { ok: false, error: "אפשר להעלות רק תמונות (PNG, JPG, WEBP, GIF)" };
  const sniffed = sniffImageMime(bytes);
  if (!sniffed) return { ok: false, error: "הקובץ לא נראה כמו תמונה תקינה" };
  const url = await adapter().save(bytes, sniffed);
  return { ok: true, url };
}

/** Best-effort cleanup of an image no longer referenced anywhere. Never throws. */
export async function removeUploadedImage(url: string): Promise<void> {
  await adapter()
    .remove(url)
    .catch((e) => console.error("image cleanup failed (non-fatal):", e instanceof Error ? e.message : e));
}
