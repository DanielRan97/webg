import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser } from "./session";

export { adminEmailList, isAdminEmail } from "./admin-emails";
import { isAdminEmail } from "./admin-emails";

/**
 * Gates every admin page and every admin server action. Uses notFound(), not
 * a login redirect, so a non-admin (anonymous or logged in) never learns that
 * `/admin` exists - the same not-found-vs-not-yours convention already used
 * for site ownership elsewhere in this app (see withOwnedSite).
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  return user;
}
