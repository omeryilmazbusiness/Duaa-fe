export const VOICE_KINDS = ["review", "complaint", "request"] as const;
export type VoiceKind = (typeof VOICE_KINDS)[number];

export interface CafeQRCode {
  siteId: string;
  label: string;
  area: string;
  branch: string;
  active: boolean;
  token: string;
  publicPath: string;
  publicUrl: string;
  imagePath: string;
  issuedAt: string;
}

export type RecoveryStatus = "open" | "assigned" | "closed";
export type RecoveryAction = "assign" | "compensate" | "close";

export interface CafeVoice {
  id: string;
  siteId: string;
  label: string;
  area: string;
  kind: VoiceKind;
  rating: number;
  comment: string;
  contactName: string;
  contactPhone: string;
  unhappy: boolean;
  needsRecovery: boolean;
  recoveryId: string;
  recoveryStatus: RecoveryStatus | "";
  assigneeUserId: string;
  linkedTaskId: string;
  compensationAmount: number;
  compensationCurrency: string;
  compensationLimit: number;
  ackDue: string;
  resolveDue: string;
  lateAck: boolean;
  lateResolve: boolean;
  createdAt: string;
}

export interface PublicQR {
  cafeName: string;
  label: string;
  area: string;
  branch: string;
  reviewsOpen: boolean;
  ackMinutes: number;
  afterHoursMessage: string;
  timezone: string;
}

export interface PublicQRSubmit {
  kind?: VoiceKind;
  rating?: number;
  comment: string;
  contactName?: string;
  contactPhone?: string;
}

export function isValidQRToken(raw: string): boolean {
  return /^[A-Za-z0-9_-]{22}$/.test(raw.trim());
}

export function isVoiceKind(value: string): value is VoiceKind {
  return (VOICE_KINDS as readonly string[]).includes(value);
}

export function parseTableNumber(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value || value.length > 16) return null;
  if (!/[A-Za-z0-9]/.test(value)) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9./\- ]*$/.test(value)) return null;
  return value;
}

export function tableHeading(label: string, area: string, tableWord: string): string {
  if (area === "table") return `${tableWord} ${label}`.trim();
  return label;
}
