import "server-only";
import sharp from "sharp";

/**
 * Every uploaded photo is made web-ready before it is stored: turned upright (by its EXIF orientation),
 * scaled down to at most 2400px on its long side (never enlarged), and saved as WebP. That keeps
 * customers' sites fast on phones, and it drops the photo's metadata - including any GPS location
 * a phone camera wrote into it. GIFs are kept as they are, since they may be animated.
 */
const MAX_SIDE = 2400;
const QUALITY = 82;

export type OptimizeResult = { ok: true; bytes: Buffer; mime: string } | { ok: false };

export async function optimizeImage(bytes: Buffer, mime: string): Promise<OptimizeResult> {
  if (mime === "image/gif") return { ok: true, bytes, mime };
  try {
    const out = await sharp(bytes, { failOn: "error" })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      // Full-quality alpha keeps transparent logos' edges crisp.
      .webp({ quality: QUALITY, alphaQuality: 100, smartSubsample: true })
      .toBuffer();
    return { ok: true, bytes: out, mime: "image/webp" };
  } catch {
    return { ok: false };
  }
}
