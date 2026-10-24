export interface SmsAdapter {
  /** Sends a short text message to an Israeli number in the "05..." form. */
  send(to: string, text: string): Promise<void>;
}
