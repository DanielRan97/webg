import "server-only";
import { Resend } from "resend";
import type { EmailAdapter } from "./types";

/** Real transactional email via Resend. Used whenever RESEND_API_KEY is set (see index.ts). */
export function createResendAdapter(apiKey: string, from: string): EmailAdapter {
  const resend = new Resend(apiKey);
  return {
    async send({ to, subject, html, text }) {
      const { error } = await resend.emails.send({ from, to, subject, html, text });
      // Never log the API key or full request; the error object from Resend
      // does not include it, only a message/name, which is safe to log.
      if (error) throw new Error(`Resend failed to send: ${error.message}`);
    },
  };
}
