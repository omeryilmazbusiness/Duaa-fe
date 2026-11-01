export type POSTicketKind = "sale" | "return";
export type POSTender = "cash" | "card" | "other";
export type POSDayStatus = "live" | "unavailable";

export interface POSTicket {
  id: string;
  externalRef: string;
  businessDate: string;
  kind: POSTicketKind;
  lines: number;
  gross: number;
  discount: number;
  net: number;
  tender: POSTender;
  recordedAt: string;
}

export interface POSDay {
  businessDate: string;
  timezone: string;
  status: POSDayStatus;
  reasonKey?: string;
  ticketCount: number;
  saleCount: number;
  returnCount: number;
  gross: number;
  discount: number;
  returns: number;
  net: number;
  basket: number;
  cash: number;
  card: number;
  other: number;
  closed: boolean;
  closedAt?: string;
  tickets: POSTicket[];
  canRecord: boolean;
}

export interface POSTicketDraft {
  businessDate?: string;
  externalRef: string;
  kind: POSTicketKind;
  tender: POSTender;
  lines: number;
  gross: number;
  discount?: number;
}

export function isLivePOS(day: { status: string; ticketCount?: number }): boolean {
  return day.status === "live" && (day.ticketCount ?? 0) > 0;
}
