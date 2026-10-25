import "server-only";

/**
 * Platform admins, by email - the single source of truth for who can reach
 * `/admin`. Comma-separated in ADMIN_EMAILS; unset/empty means nobody can
 * (fail-closed), so a normal deploy without this variable set never exposes
 * the dashboard by accident. Kept apart from admin.ts (which needs the session)
 * so internal notifications, like the SMS balance alert, can use the list too.
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

/** The configured admin addresses, for sending internal notifications (e.g. a new support ticket) - never used to accept a recipient from a client. */
export function adminEmailList(): string[] {
  return [...adminEmails()];
}
