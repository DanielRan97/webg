import "server-only";
import type { SmsAdapter } from "./types";

/** Development fallback when no SMS provider is configured: the message is printed to the server console. */
export const consoleSmsAdapter: SmsAdapter = {
  async send(to, text) {
    console.log(["", "———————————————————————————————————————————", "  📱  SMS (dev mode - no SMS provider set)", `  To:   ${to}`, "———————————————————————————————————————————", text, "———————————————————————————————————————————", ""].join("\n"));
  },
};
