export type HotelFreshness = "current" | "delayed" | "stale" | "unavailable";
export type OHIPSyncMode = "ohip_api" | "opera_export";
export type OHIPSyncStatus = "never" | "ok" | "error";
export type ReservationStatus = "reserved" | "checked_in" | "checked_out" | "cancelled" | "no_show";

export interface OHIPConfigView {
  configured: boolean;
  enabled: boolean;
  hostUrl?: string;
  hotelId?: string;
  clientId?: string;
  secretHint?: string;
  appKeyHint?: string;
  syncMode: OHIPSyncMode;
  lastSyncAt?: string;
  lastSyncStatus: OHIPSyncStatus;
  lastError?: string;
}

export interface OHIPConfigSave {
  enabled: boolean;
  hostUrl: string;
  hotelId: string;
  clientId: string;
  clientSecret?: string;
  appKey?: string;
  syncMode: OHIPSyncMode;
}

export interface DepartmentReadiness {
  department: string;
  total: number;
  completed: number;
  note?: string;
}

export interface ReservationRow {
  confirmationNo: string;
  guestName: string;
  roomType: string;
  status: ReservationStatus;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  rateMinor: number;
  currency: string;
  channel?: string;
  vip?: boolean;
}

export interface PMSSnapshotView {
  id: string;
  businessDate: string;
  source: string;
  externalBatchRef?: string;
  currency: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfOrderRooms: number;
  occupancyPct: number;
  roomRevenueMinor: number;
  fbRevenueMinor: number;
  otherRevenueMinor: number;
  totalRevenueMinor: number;
  adrMinor: number;
  revparMinor: number;
  arrivalsCount: number;
  departuresCount: number;
  inHouseGuests: number;
  reservationsCount: number;
  cancelledCount: number;
  noShowCount: number;
  readiness: DepartmentReadiness[];
  readinessPct: number;
  reservations: ReservationRow[];
  capturedAt: string;
}

export interface PMSSnapshotSummary {
  businessDate: string;
  currency: string;
  occupancyPct: number;
  totalRevenueMinor: number;
  roomRevenueMinor: number;
  adrMinor: number;
  revparMinor: number;
  reservationsCount: number;
  source: string;
}

export interface HotelComparison {
  yesterdayDate: string;
  hasYesterday: boolean;
  yesterdayRevenueMinor: number;
  revenueDeltaMinor: number;
  revenueDeltaPct?: number;
  yesterdayOccupancyPct?: number;
  occupancyDeltaPts?: number;
}

export interface HotelPMSView {
  workspaceId: string;
  workspaceName: string;
  businessDate: string;
  timezone: string;
  freshness: HotelFreshness;
  reasonKey?: string;
  replayed?: boolean;
  connector: OHIPConfigView;
  today?: PMSSnapshotView;
  comparison?: HotelComparison;
  recentDays: PMSSnapshotSummary[];
  canManageOhip: boolean;
  canRecord: boolean;
  profile: HotelProfile;
}

export interface HotelProfileSave {
  displayName: string;
  totalRooms: number;
  currency: string;
  timezone: string;
  starRating: number;
  city: string;
  address: string;
  phone: string;
  gmName: string;
  notes: string;
}

export interface HotelProfile extends HotelProfileSave {
  updatedAt?: string;
  persisted: boolean;
  canWrite: boolean;
}

export interface HotelPMSImportInput {
  businessDate?: string;
  source?: string;
  externalBatchRef?: string;
  currency?: string;
  totalRooms?: number;
  occupiedRooms?: number;
  outOfOrderRooms?: number;
  roomRevenueMinor?: number;
  fbRevenueMinor?: number;
  otherRevenueMinor?: number;
  arrivalsCount?: number;
  departuresCount?: number;
  inHouseGuests?: number;
  reservationsCount?: number;
  rawContent?: string;
}

/** IQD is stored in whole dinars; other currencies in cents (same rule as formatMinorMoney). */
export function majorToMinor(major: number, currency: string): number {
  if (!Number.isFinite(major)) return 0;
  return currency === "IQD" ? Math.round(major) : Math.round(major * 100);
}

export function minorToMajor(minor: number, currency: string): number {
  return currency === "IQD" ? minor : minor / 100;
}

/** Parses a typed amount like "18 000,50" or "18000.50"; empty means zero. */
export function parseAmount(raw: string): number | null {
  const compact = raw.replace(/[\s\u00a0]/g, "");
  if (!compact) return 0;
  const normalized = /,\d{1,2}$/.test(compact) ? compact.replace(/\./g, "").replace(",", ".") : compact.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

export function parseCount(raw: string): number | null {
  const v = raw.trim();
  if (!v) return 0;
  if (!/^\d+$/.test(v)) return null;
  return Number(v);
}

export type DailyFiguresIssue = "invalid_number" | "rooms_required" | "ooo_exceeds_total" | "occupied_exceeds_available";

export interface DailyFiguresDraft {
  totalRooms: string;
  occupiedRooms: string;
  outOfOrderRooms: string;
  roomRevenue: string;
  fbRevenue: string;
  otherRevenue: string;
  arrivals: string;
  departures: string;
  inHouseGuests: string;
}

/** Validates a manual daily entry with the same room rules the backend enforces. */
export function buildDailyFigures(
  draft: DailyFiguresDraft,
  currency: string,
): { ok: true; value: Required<Omit<HotelPMSImportInput, "businessDate" | "source" | "externalBatchRef" | "currency" | "rawContent" | "reservationsCount">> } | { ok: false; issue: DailyFiguresIssue } {
  const counts = [draft.totalRooms, draft.occupiedRooms, draft.outOfOrderRooms, draft.arrivals, draft.departures, draft.inHouseGuests].map(parseCount);
  const amounts = [draft.roomRevenue, draft.fbRevenue, draft.otherRevenue].map(parseAmount);
  const [totalRooms, occupiedRooms, outOfOrderRooms, arrivalsCount, departuresCount, inHouseGuests] = counts;
  const [room, fb, other] = amounts;
  if (
    totalRooms == null ||
    occupiedRooms == null ||
    outOfOrderRooms == null ||
    arrivalsCount == null ||
    departuresCount == null ||
    inHouseGuests == null ||
    room == null ||
    fb == null ||
    other == null
  ) {
    return { ok: false, issue: "invalid_number" };
  }
  if (totalRooms <= 0) return { ok: false, issue: "rooms_required" };
  if (outOfOrderRooms > totalRooms) return { ok: false, issue: "ooo_exceeds_total" };
  if (occupiedRooms > totalRooms - outOfOrderRooms) return { ok: false, issue: "occupied_exceeds_available" };
  return {
    ok: true,
    value: {
      totalRooms,
      occupiedRooms,
      outOfOrderRooms,
      roomRevenueMinor: majorToMinor(room, currency),
      fbRevenueMinor: majorToMinor(fb, currency),
      otherRevenueMinor: majorToMinor(other, currency),
      arrivalsCount,
      departuresCount,
      inHouseGuests,
    },
  };
}

export function formatMinorMoney(minor: number, currency: string, locale: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: currency === "IQD" ? 0 : 2,
    }).format(currency === "IQD" ? minor : major);
  } catch {
    return `${(currency === "IQD" ? minor : major).toLocaleString(locale)} ${currency || "USD"}`;
  }
}
