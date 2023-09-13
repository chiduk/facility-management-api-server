export interface Message {
  from: string;
  to: string;
  subject: string;

  html?: string;
}
