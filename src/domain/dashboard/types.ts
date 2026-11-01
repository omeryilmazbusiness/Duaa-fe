export type TileStatus = "live" | "unavailable";

export interface DashboardTile {
  module: string;
  status: TileStatus;
  reasonKey?: string;
  value: number;
  labelKey: string;
}

export interface DashboardPulse {
  employees: number;
  openTasks: number;
  overdueTasks: number;
  completedToday: number;
  openReports: number;
  overloadedStaff: number;
  pendingApprovals: number;
}

export interface DashboardSales {
  status: TileStatus;
  reasonKey?: string;
  businessDate: string;
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
}

export interface DashboardCash {
  status: TileStatus;
  reasonKey?: string;
  businessDate: string;
  countedAmount?: number;
  expectedAmount?: number;
  variance: number;
  closedAt?: string;
}

export interface DashboardApproval {
  id: string;
  title: string;
  supplier: string;
  amount: number;
  currency: string;
  evidence?: string;
  version: number;
  status: string;
}

export interface WorkloadRow {
  userId: string;
  name: string;
  department?: string;
  openTasks: number;
  overdueTasks: number;
}

export interface DashboardView {
  generatedAt: string;
  date: string;
  workspaceKind: string;
  pulse: DashboardPulse;
  tiles: DashboardTile[];
  cash?: DashboardCash;
  sales?: DashboardSales;
  approvals?: DashboardApproval[];
  workload: WorkloadRow[];
}

export function isLiveTile(tile: DashboardTile): boolean {
  return tile.status === "live";
}

/** Waste and occupancy stay missing until their adapters exist. Sales go live only from recorded tickets. */
export function isBoundSource(tile: DashboardTile): boolean {
  return tile.module === "waste" || tile.module === "occupancy";
}
