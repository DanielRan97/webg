import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ALLOWED_TYPES } from "./shared";
import type { StorageAdapter } from "./types";

/**
 * Development fallback only - writes to a local `uploads/` folder. This
 * never runs in production (env.ts requires R2 credentials whenever
 * NODE_ENV is "production"), because a serverless host's filesystem is
 * ephemeral: files written here would vanish on the next deploy or even
 * the next cold start.
 */
const DIR = path.join(process.cwd(), "uploads");

/** Filenames are always our own random UUID + a known extension - never derived from user input, so there is nothing to path-traverse with. */
const SAFE_NAME = /^[a-zA-Z0-9-]+\.(png|jpg|jpeg|webp|gif)$/;

export const localAdapter: StorageAdapter = {
  async save(bytes, mime) {
    const ext = ALLOWED_TYPES[mime];
    await mkdir(DIR, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(DIR, name), bytes);
    return `/api/files/${name}`;
  },
  async remove(url) {
    const name = url.split("/").pop() ?? "";
    if (!SAFE_NAME.test(name)) return;
    await unlink(path.join(DIR, name)).catch(() => {});
  },
};

export async function readLocalImage(name: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!SAFE_NAME.test(name)) return null;
  const ext = name.split(".").pop()!;
  const mime = Object.entries(ALLOWED_TYPES).find(([, e]) => e === ext)?.[0];
  if (!mime) return null;
  try {
    return { bytes: await readFile(path.join(DIR, name)), mime };
  } catch {
    return null;
  }
}
