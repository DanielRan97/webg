import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Cryptographically random, single-use tokens (password reset, email
 * verification). The raw token goes in the URL/email; only its SHA-256
 * hash is ever stored, so a database leak never yields a usable token.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
