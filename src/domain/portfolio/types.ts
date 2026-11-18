import type { SimplifiedSummary } from "@/domain/docintake/types";

export interface ChannelStatus {
  key: string;
  entered: boolean;
  updatedAt?: string;
}

export interface WorkspaceCompleteness {
  workspaceId: string;
  workspaceName: string;
  kind: string;
  enteredCount: number;
  expectedCount: number;
  pct: number;
  channels: ChannelStatus[];
}

export interface CompletenessSummary {
  overallPct: number;
  byWorkspace: WorkspaceCompleteness[];
}

export interface CurrencyTotal {
  currency: string;
  hotelCount: number;
  todayTotalRevenueMinor: number;
  todayRoomRevenueMinor: number;
  yesterdayRevenueMinor: number;
  hasYesterday: boolean;
  deltaMinor: number;
  deltaPct?: number;
}

export interface HotelCard {
  workspaceId: string;
  name: string;
  slug: string;
  businessDate: string;
  freshness: "current" | "delayed" | "stale" | "unavailable";
  source?: string;
  currency?: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfOrderRooms: number;
  occupancyPct?: number;
  roomRevenueMinor: number;
  fbRevenueMinor: number;
  otherRevenueMinor: number;
  totalRevenueMinor: number;
  adrMinor: number;
  revparMinor: number;
  arrivalsCount: number;
  departuresCount: number;
  reservationsCount: number;
  yesterdayRevenueMinor: number;
  hasYesterday: boolean;
  revenueDeltaMinor: number;
  revenueDeltaPct?: number;
  readinessPct: number;
  completenessPct: number;
  openTasks: number;
  overdueTasks: number;
  openReports: number;
  ohipConfigured: boolean;
  ohipLastSyncStatus: string;
}

export interface HotelsSummary {
  count: number;
  connectedCount: number;
  avgOccupancyPct?: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfOrderRooms: number;
  totalArrivals: number;
  totalDepartures: number;
  totalsByCurrency: CurrencyTotal[];
  hotels: HotelCard[];
}

export interface CafeProfitability {
  status: "live" | "provisional" | "unavailable";
  currency: string;
  salesNet: number;
  wasteCost: number;
  approvedExpenses: number;
  pendingApprovalsCount: number;
  estimatedNet: number;
  marginPct?: number;
  complete: boolean;
}

export interface CafeCard {
  workspaceId: string;
  name: string;
  slug: string;
  businessDate: string;
  salesStatus: "live" | "unavailable";
  salesNet: number;
  salesGross: number;
  ticketCount: number;
  posClosed: boolean;
  wasteStatus: "live" | "unavailable";
  wasteCost: number;
  wasteGrams: number;
  stockStatus: "live" | "unavailable";
  stockItems: number;
  stockLowCount: number;
  cashStatus: "live" | "unavailable";
  cashVariance: number;
  profitability: CafeProfitability;
  completenessPct: number;
  openTasks: number;
  overdueTasks: number;
  openReports: number;
  openRecoveries: number;
}

export interface CafeSummary {
  count: number;
  cafes: CafeCard[];
}

export interface PortfolioRecentDoc {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceKind: string;
  businessDate: string;
  fileName: string;
  sourceKind: string;
  status: string;
  aiUsed: boolean;
  dataCoveragePct: number;
  summary: SimplifiedSummary;
  createdAt: string;
}

export interface PortfolioView {
  generatedAt: string;
  date: string;
  workspaceCount: number;
  completeness: CompletenessSummary;
  hotels: HotelsSummary;
  cafes: CafeSummary;
  recentDocuments: PortfolioRecentDoc[];
}
