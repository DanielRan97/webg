import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Storage adapter. Local disk for now; to use S3/R2 in production, implement the
 * same three functions and keep the returned URL shape (`/api/files/<name>`)
 * or return absolute CDN URLs and relax `imageUrl` in validation.ts.
 */
const DIR = path.join(process.cwd(), "uploads");

export const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function saveImage(bytes: Buffer, mime: string): Promise<string> {
  const ext = ALLOWED_TYPES[mime];
  if (!ext) throw new Error("Unsupported type");
  await mkdir(DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(DIR, name), bytes);
  return `/api/files/${name}`;
}

export async function readImage(name: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!/^[a-zA-Z0-9-]+\.(png|jpg|webp|gif)$/.test(name)) return null;
  const ext = name.split(".").pop()!;
  const mime = Object.entries(ALLOWED_TYPES).find(([, e]) => e === ext)![0];
  try {
    return { bytes: await readFile(path.join(DIR, name)), mime };
  } catch {
    return null;
  }
}
