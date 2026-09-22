import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ALLOWED_TYPES } from "./shared";
import type { StorageAdapter } from "./types";

/** Cloudflare R2 is S3-compatible, so the standard AWS SDK works against it with a custom endpoint. */
function client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/** A fresh random key every time - never derived from the uploader's filename, so nothing to path-traverse or collide with. */
function newKey(mime: string): string {
  const ext = ALLOWED_TYPES[mime];
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `uploads/${y}/${m}/${randomUUID()}.${ext}`;
}

function publicBase(): string {
  return process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
}

export const r2Adapter: StorageAdapter = {
  async save(bytes, mime) {
    const key = newKey(mime);
    await client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: bytes,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${publicBase()}/${key}`;
  },
  async remove(url) {
    const base = publicBase();
    // Only ever delete an object that is demonstrably ours (matches our own
    // public base) - this is what stops the cleanup logic in
    // server/websites.ts from ever being able to touch anything else,
    // even if a bug somewhere fed it an unexpected URL.
    if (!url.startsWith(`${base}/`)) return;
    const key = url.slice(base.length + 1);
    if (!key || key.includes("..")) return;
    await client()
      .send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }))
      .catch(() => {});
  },
};
