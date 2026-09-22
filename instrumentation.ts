/**
 * Runs once when the Next.js server starts, before it accepts any requests.
 * Used to validate required environment variables immediately - see
 * src/lib/env.ts for what is checked and why.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./src/lib/env");
    validateEnv();
  }
}
