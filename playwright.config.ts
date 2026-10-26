import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests (tests/e2e): the real app in a real browser, against the database in .env -
 * which must be the Neon `dev` branch, never production (tests/e2e/db.ts refuses otherwise).
 * Its own dev server on port 3001, with email and SMS keys blanked so nothing is really sent
 * (both fall back to printing in the server console). Test accounts are deleted afterwards.
 */
const PORT = 3001;

export default defineConfig({
  testDir: "tests/e2e",
  // Generous: in dev mode the first visit to each page compiles it.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Must match TEST_IP in tests/e2e/db.ts (rate-limit counters the cleanup can clear).
    extraHTTPHeaders: { "x-forwarded-for": "203.0.113.77" },
  },
  globalSetup: "./tests/e2e/cleanup.ts",
  globalTeardown: "./tests/e2e/cleanup.ts",
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // E2E_SERVER_LOG=1 shows the server's console - e.g. the emails it "sends" (printed, never sent).
    stdout: process.env.E2E_SERVER_LOG ? "pipe" : "ignore",
    timeout: 180_000,
    // Billing runs against the fake gateway (lib/payments/fake.ts); HYP's settings are blanked.
    env: {
      RESEND_API_KEY: "",
      GLOBALSMS_API_KEY: "",
      SMS_SENDER: "",
      HYP_MASOF: "",
      HYP_KEY: "",
      HYP_PASSP: "",
      PAYMENTS_FAKE: "1",
      CRON_SECRET: "e2e-cron-secret",
    },
  },
});
