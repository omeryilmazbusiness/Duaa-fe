export type InboxCategory =
  | ""
  | "guest"
  | "reservation"
  | "supplier"
  | "staff"
  | "finance"
  | "complaint"
  | "marketing"
  | "internal"
  | "other";

export interface InboxStatus {
  connected: boolean;
  provider?: string;
  email?: string;
  displayName?: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastError?: string;
  unreadCount: number;
  outlookReady: boolean;
  hasAppCredentials?: boolean;
  authUrl?: string;
  redirectUrl?: string;
}

export interface InboxMessage {
  id: string;
  externalId: string;
  folder: "inbox" | "sent" | string;
  fromName: string;
  fromEmail: string;
  toEmails: string;
  subject: string;
  bodyText: string;
  preview: string;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
  category: InboxCategory | string;
  summary: string;
  summaryAr: string;
  bodyAr: string;
  detectedLanguage: string;
  enriched: boolean;
}

export interface InboxList {
  status: InboxStatus;
  messages: InboxMessage[];
}

export interface InboxComposeTranslate {
  translated: string;
  targetLang: "en" | "tr" | string;
}
