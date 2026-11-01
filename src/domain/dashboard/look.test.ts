import { describe, expect, it } from "vitest";
import {
  cashVarianceLook,
  dashboardQuickActions,
  PULSE_KPIS,
  pulseKpis,
  reasonCopyKey,
  sourceTiles,
  tileCopyKey,
  tileIconKey,
  tileTone,
  workloadTone,
} from "./look";
import { isBoundSource, isLiveTile, type DashboardPulse, type DashboardTile } from "./types";

const pulse: DashboardPulse = {
  employees: 4,
  openTasks: 7,
  overdueTasks: 2,
  completedToday: 1,
  openReports: 0,
  overloadedStaff: 0,
  pendingApprovals: 3,
};

describe("dashboard look", () => {
  it("maps four pulse KPIs with Wodi tones and live values", () => {
    expect(PULSE_KPIS.map((item) => item.tone)).toEqual(["sky", "amber", "rose", "violet"]);
    expect(pulseKpis(pulse).map((item) => item.value)).toEqual([4, 7, 2, 1]);
  });

  it("drops the pulse module from source tiles and keeps empty POS unavailable", () => {
    const tiles: DashboardTile[] = [
      { module: "pulse", status: "live", value: 0, labelKey: "overdue" },
      { module: "sales", status: "unavailable", reasonKey: "dash.posNotWired", value: 0, labelKey: "sales" },
      { module: "cash", status: "live", value: -2000, labelKey: "sourceCash" },
      { module: "waste", status: "unavailable", reasonKey: "dash.wasteNotWired", value: 0, labelKey: "waste" },
    ];
    const sources = sourceTiles(tiles);
    expect(sources.map((tile) => tile.module)).toEqual(["sales", "cash", "waste"]);
    expect(isBoundSource(sources[0]!)).toBe(false);
    expect(isBoundSource(sources[2]!)).toBe(true);
    expect(isLiveTile(sources[0]!)).toBe(false);
    expect(tileTone(sources[0]!)).toBe("zinc");
    expect(tileTone(sources[1]!)).toBe("rose");
    expect(reasonCopyKey(sources[0]!.reasonKey)).toBe("posNotWired");
    expect(isLiveTile({ module: "sales", status: "live", value: 9000, labelKey: "sales" })).toBe(true);
    expect(tileCopyKey("sourceCash")).toBe("sourceCash");
    expect(tileIconKey("occupancy")).toBe("occupancy");
    expect(tileIconKey("unknown")).toBe("reports");
  });

  it("filters quick actions by granted tabs and GM", () => {
    expect(dashboardQuickActions(["dashboard", "today", "ops"], false).map((item) => item.id)).toEqual(["today", "ops"]);
    expect(dashboardQuickActions(["dashboard", "today", "ops", "feedback"], true).map((item) => item.id)).toEqual([
      "today",
      "ops",
      "feedback",
      "settings",
    ]);
  });

  it("marks overdue workload rose and cash variance by sign", () => {
    expect(workloadTone({ userId: "1", name: "A", openTasks: 2, overdueTasks: 1 })).toBe("rose");
    expect(workloadTone({ userId: "2", name: "B", openTasks: 2, overdueTasks: 0 })).toBe("amber");
    expect(cashVarianceLook(-500, true, true)).toEqual({ tone: "rose", captionKey: "cashMissing" });
    expect(cashVarianceLook(200, true, true)).toEqual({ tone: "amber", captionKey: "cashExtra" });
    expect(cashVarianceLook(0, true, true)).toEqual({ tone: "emerald", captionKey: "cashBalanced" });
    expect(cashVarianceLook(0, false, false)).toEqual({ tone: "zinc", captionKey: "cashAwaiting" });
  });
});
