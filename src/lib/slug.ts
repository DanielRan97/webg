import { db } from "./db";
import { RESERVED_SLUGS, slugify } from "./slug-format";

export { isValidSlug, slugify, RESERVED_SLUGS } from "./slug-format";

/** Returns `base`, or `base-2`, `base-3`... whichever is free (ignoring the site being edited). */
export async function uniqueSlug(base: string, excludeWebsiteId?: string): Promise<string> {
  let root = slugify(base) || "site";
  if (root.length < 3) root = `${root}-site`;
  if (RESERVED_SLUGS.has(root)) root = `${root}-site`;
  for (let i = 1; i < 500; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const hit = await db.website.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!hit || hit.id === excludeWebsiteId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
