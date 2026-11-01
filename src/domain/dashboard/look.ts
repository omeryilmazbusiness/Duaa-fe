import type { ManagerTab } from "@/domain/catalog";
import type { Tone } from "@/theme/tones";
import type { DashboardPulse, DashboardTile, WorkloadRow } from "./types";

export type PulseKpiId = "employees" | "open" | "overdue" | "done";

export type DashCopyKey =
  | "employees"
  | "open"
  | "overdue"
  | "completedToday"
  | "employeeReports"
  | "sourceCash"
  | "pendingApprovals"
  | "sales"
  | "waste"
  | "occupancy"
  | "cashNotClosed"
  | "posNotWired"
  | "wasteNotWired"
  | "occupancyNotWired"
  | "sourceUnavailable"
  | "cashMissing"
  | "cashExtra"
  | "cashBalanced"
  | "cashAwaiting";

export type TileIconKey = "reports" | "cash" | "approvals" | "sales" | "waste" | "occupancy";

export interface PulseKpiSpec {
  id: PulseKpiId;
  tone: Tone;
  valueKey: keyof DashboardPulse;
  labelKey: Extract<DashCopyKey, "employees" | "open" | "overdue" | "completedToday">;
}

/** Four Wodi StatTiles — sky / amber / rose / violet, matching the manager board. */
export const PULSE_KPIS: readonly PulseKpiSpec[] = [
  { id: "employees", tone: "sky", valueKey: "employees", labelKey: "employees" },
  { id: "open", tone: "amber", valueKey: "openTasks", labelKey: "open" },
  { id: "overdue", tone: "rose", valueKey: "overdueTasks", labelKey: "overdue" },
  { id: "done", tone: "violet", valueKey: "completedToday", labelKey: "completedToday" },
];

export type DashboardQuickId = "today" | "ops" | "feedback" | "settings";

export interface DashboardQuickSpec {
  id: DashboardQuickId;
  tone: Tone;
  tab?: ManagerTab;
  settings?: boolean;
}

const QUICK: readonly DashboardQuickSpec[] = [
  { id: "today", tone: "sky", tab: "today" },
  { id: "ops", tone: "amber", tab: "ops" },
  { id: "feedback", tone: "violet", tab: "feedback" },
  { id: "settings", tone: "indigo", settings: true },
];

export function dashboardQuickActions(tabs: readonly ManagerTab[], isGm: boolean): DashboardQuickSpec[] {
  const allowed = new Set(tabs);
  return QUICK.filter((item) => (item.settings ? isGm : Boolean(item.tab && allowed.has(item.tab))));
}

export function sourceTiles(tiles: readonly DashboardTile[]): DashboardTile[] {
  return tiles.filter((tile) => tile.module !== "pulse");
}

export function tileIconKey(module: string): TileIconKey {
  if (module === "reports" || module === "cash" || module === "approvals" || module === "sales" || module === "waste" || module === "occupancy") {
    return module;
  }
  return "reports";
}

export function tileTone(tile: DashboardTile): Tone {
  if (tile.status !== "live") return "zinc";
  if (tile.module === "cash" && tile.value !== 0) return "rose";
  switch (tile.module) {
    case "cash":
      return "teal";
    case "approvals":
      return "violet";
    case "sales":
      return "sky";
    case "waste":
      return "amber";
    case "occupancy":
      return "indigo";
    case "reports":
      return "amber";
    default:
      return "zinc";
  }
}

export function tileCopyKey(labelKey: string): DashCopyKey {
  switch (labelKey) {
    case "overdue":
    case "employeeReports":
    case "sourceCash":
    case "pendingApprovals":
    case "sales":
    case "waste":
    case "occupancy":
      return labelKey;
    default:
      return "sourceUnavailable";
  }
}

export function reasonCopyKey(reasonKey: string | undefined): DashCopyKey {
  switch (reasonKey) {
    case "brief.cashNotClosed":
      return "cashNotClosed";
    case "dash.posNotWired":
      return "posNotWired";
    case "dash.wasteNotWired":
      return "wasteNotWired";
    case "dash.occupancyNotWired":
      return "occupancyNotWired";
    default:
      return "sourceUnavailable";
  }
}

export function pulseKpis(pulse: DashboardPulse): Array<PulseKpiSpec & { value: number }> {
  return PULSE_KPIS.map((spec) => ({ ...spec, value: pulse[spec.valueKey] }));
}

export function workloadTone(row: WorkloadRow): Tone {
  return row.overdueTasks > 0 ? "rose" : "amber";
}

export function cashVarianceLook(
  variance: number,
  live: boolean,
  hasExpected: boolean,
): { tone: Tone; captionKey: Extract<DashCopyKey, "cashMissing" | "cashExtra" | "cashBalanced" | "cashAwaiting"> } {
  if (!live || !hasExpected) return { tone: "zinc", captionKey: "cashAwaiting" };
  if (variance < 0) return { tone: "rose", captionKey: "cashMissing" };
  if (variance > 0) return { tone: "amber", captionKey: "cashExtra" };
  return { tone: "emerald", captionKey: "cashBalanced" };
}
