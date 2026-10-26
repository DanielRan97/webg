import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests (tests/unit): pure logic only - no server, database or network. Modules marked
 * `import "server-only"` throw outside the Next.js server, so that import is mapped to an empty stub.
 * Browser flows are covered by Playwright (tests/e2e, `npm run test:e2e`).
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
