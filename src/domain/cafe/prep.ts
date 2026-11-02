export type PrepStation = "kitchen" | "bar";
export type PrepStatus = "waiting" | "ready" | "served";
export type PrepDayStatus = "live" | "unavailable";

export interface PrepTicket {
  id: string;
  ticketRef: string;
  tableLabel?: string;
  station: PrepStation;
  status: PrepStatus;
  waitMinutes: number;
  openMinutes: number;
  receivedAt: string;
  readyAt?: string;
  servedAt?: string;
  businessDate: string;
}

export interface PrepDay {
  businessDate: string;
  timezone: string;
  status: PrepDayStatus;
  reasonKey?: string;
  ticketCount: number;
  waitingCount: number;
  readyCount: number;
  servedCount: number;
  longestOpenMinutes: number;
  tickets: PrepTicket[];
  canRecord: boolean;
}

export interface PrepTicketDraft {
  businessDate?: string;
  station: PrepStation;
  ticketRef: string;
  tableLabel?: string;
}

export function isLivePrep(day: { status: string; ticketCount?: number }): boolean {
  return day.status === "live" && (day.ticketCount ?? 0) > 0;
}
