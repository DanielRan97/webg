/**
 * Cheap bot checks for the public site forms, no third party involved: a hidden field people never see
 * (bots fill every field), and a minimum time between the form appearing and being sent. A caught
 * submission gets the normal success reply but is dropped, so the bot learns nothing, and it is dropped
 * before the per-site rate limit, so a flood of bots can't use up a business's quota for real customers.
 */
export const MIN_FILL_MS = 1500;

export interface FormGuard {
  /** The hidden field's value - empty for a person. */
  trap?: string;
  /** Milliseconds from the form appearing to being sent. */
  elapsedMs?: number;
}

export function looksLikeBot(g: FormGuard | undefined): boolean {
  if (!g) return true;
  if (typeof g.trap === "string" && g.trap.trim() !== "") return true;
  return typeof g.elapsedMs !== "number" || !Number.isFinite(g.elapsedMs) || g.elapsedMs < MIN_FILL_MS;
}
