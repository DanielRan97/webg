import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser } from "./session";

/**
 * Platform admins, by email - the single source of truth for who can reach
 * `/admin`. Comma-separated in ADMIN_EMAILS; unset/empty means nobody can
 * (fail-closed), so a normal deploy without this variable set never exposes
 * the dashboard by accident.
 */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().has(email.trim().toLowerCase());
}

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
