import "server-only";
import { z } from "zod";

/**
 * Centralized environment validation. Imported once from instrumentation.ts
 * (register()), so the app fails immediately and loudly at startup if a
 * required secret is missing or malformed, instead of failing confusingly
 * later inside a request (e.g. a cryptic Prisma or fetch error).
 *
 * Split in two: variables required always, and variables required only in
 * production (so local development stays simple - no Resend/R2 needed to
 * run `npm run dev`; both have working fallbacks, see email/ and storage/).
 *
 * Plain presence checks are used (not a zod object schema) so every missing
 * variable gets our own message, not zod's generic "expected string,
 * received undefined" for whichever ones happen to be unset.
 */

function requireNonEmpty(name: string, message: string, problems: string[]) {
  if (!process.env[name]?.trim()) problems.push(`  - ${message}`);
}

function requireUrl(name: string, message: string, problems: string[]) {
  const v = process.env[name];
  if (!v?.trim() || !z.url().safeParse(v).success) problems.push(`  - ${message}`);
}

/** Never prefix a real secret with NEXT_PUBLIC_ - anything with that prefix ships to the browser. */
const forbiddenPublicSecrets = ["NEXT_PUBLIC_SESSION_SECRET", "NEXT_PUBLIC_RESEND_API_KEY", "NEXT_PUBLIC_R2_SECRET_ACCESS_KEY", "NEXT_PUBLIC_DATABASE_URL"];

export function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const problems: string[] = [];

  requireNonEmpty("DATABASE_URL", "DATABASE_URL is required", problems);
  if (process.env.SESSION_SECRET === undefined || process.env.SESSION_SECRET.length < 32) {
    problems.push("  - SESSION_SECRET must be at least 32 characters");
  }

  if (isProd) {
    requireUrl("APP_URL", "APP_URL must be a full URL, e.g. https://webg.co.il", problems);
    requireNonEmpty("EMAIL_FROM", "EMAIL_FROM is required in production (e.g. WEBG <no-reply@webg.co.il>)", problems);
    requireNonEmpty("RESEND_API_KEY", "RESEND_API_KEY is required in production so real emails can send", problems);
    requireNonEmpty("R2_ACCOUNT_ID", "R2_ACCOUNT_ID is required in production (local disk uploads do not survive on serverless hosting)", problems);
    requireNonEmpty("R2_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID is required in production", problems);
    requireNonEmpty("R2_SECRET_ACCESS_KEY", "R2_SECRET_ACCESS_KEY is required in production", problems);
    requireNonEmpty("R2_BUCKET_NAME", "R2_BUCKET_NAME is required in production", problems);
    requireUrl("R2_PUBLIC_URL", "R2_PUBLIC_URL must be a full URL to the bucket's public origin", problems);
  }

  for (const name of forbiddenPublicSecrets) {
    if (process.env[name]) problems.push(`  - ${name} is set: never expose a secret through a NEXT_PUBLIC_ variable, it ships to every visitor's browser`);
  }

  if (problems.length > 0) {
    throw new Error(
      `WEBG cannot start: ${problems.length} environment problem(s) found${isProd ? " (production)" : ""}:\n${problems.join("\n")}\n\nSee .env.example for what each variable is for.`,
    );
  }
}

/** Absolute base URL for links sent outside the app (emails). Falls back to localhost in dev. */
export function appUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
