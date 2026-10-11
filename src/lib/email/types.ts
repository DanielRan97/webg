export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailAdapter {
  send(input: SendEmailInput): Promise<void>;
}
