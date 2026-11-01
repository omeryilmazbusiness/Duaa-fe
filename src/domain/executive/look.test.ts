import { describe, expect, it } from "vitest";
import { cardDisplayValue, cardTitleKey, cardTone, emptyBriefKey, floorKpis, headlineParts, sourceCopyKey, TODAY_KPIS, todayKpis } from "./look";
import type { BriefView } from "./types";

const emptyPulse = {
  overdueTasks: 0,
  openTasks: 0,
  completedToday: 0,
  openRecoveries: 0,
  lateRecoveries: 0,
  openBreakdowns: 0,
  handoverOpen: false,
  intakeWritten: false,
  openChecks: 0,
  openDone: 0,
  closeChecks: 0,
  closeDone: 0,
};

function brief(over: Partial<BriefView> = {}): BriefView {
  return {
    generatedAt: "2026-11-01T00:00:00Z",
    date: "2026-11-01",
    workspaceKind: "cafe",
    headline: { overdueTasks: 0, pendingDecisions: 0, assignedFollowups: 0 },
    pulse: emptyPulse,
    cards: [],
    sources: [],
    snoozedCount: 0,
    isClear: true,
    ...over,
  };
}

describe("today look", () => {
  it("maps three morning KPIs with Wodi tones", () => {
    expect(TODAY_KPIS.map((item) => item.tone)).toEqual(["rose", "amber", "emerald"]);
    expect(todayKpis({ ...emptyPulse, overdueTasks: 2, openTasks: 5, completedToday: 1 }).map((item) => item.value)).toEqual([2, 5, 1]);
  });

  it("exposes recorded floor files only — empty close is not a fake total", () => {
    const quiet = floorKpis(emptyPulse);
    expect(quiet.map((item) => item.value)).toEqual([0, 0, 0, 0, 0]);
    expect(quiet.find((item) => item.id === "handover")?.captionKey).toBe("floorHandoverQuiet");
    expect(quiet.find((item) => item.id === "checks")?.captionKey).toBe("floorChecksQuiet");
    const live = floorKpis({
      ...emptyPulse,
      openRecoveries: 1,
      lateRecoveries: 1,
      openBreakdowns: 2,
      handoverOpen: true,
      intakeWritten: true,
      openChecks: 2,
      openDone: 1,
      closeChecks: 1,
      closeDone: 0,
    });
    expect(live.map((item) => item.value)).toEqual([1, 2, 1, 1, 2]);
    expect(live.find((item) => item.id === "checks")?.captionKey).toBe("floorChecksOpen");
    expect(live.find((item) => item.id === "handover")?.captionKey).toBe("floorHandoverOpen");
  });

  it("composes headline parts only when the morning is not clear", () => {
    expect(headlineParts(brief())).toEqual([]);
    expect(
      headlineParts(
        brief({
          isClear: false,
          headline: { overdueTasks: 2, pendingDecisions: 1, assignedFollowups: 0 },
        }),
      ),
    ).toEqual([
      { one: "headlineOverdueOne", many: "headlineOverdue", n: 2 },
      { one: "headlinePendingOne", many: "headlinePending", n: 1 },
    ]);
  });

  it("keeps snoozed late work distinct from an empty inbox", () => {
    expect(emptyBriefKey(brief())).toBe("allClear");
    expect(emptyBriefKey(brief({ isClear: false, pulse: { ...emptyPulse, overdueTasks: 3, openTasks: 3 }, snoozedCount: 2 }))).toBe(
      "handledUntilTomorrow",
    );
    expect(emptyBriefKey(brief({ isClear: false }))).toBe("noMorningCards");
  });

  it("maps card kind, title and cash display without inventing a live POS figure", () => {
    expect(cardTone("late_staff")).toBe("rose");
    expect(cardTone("customer_voice")).toBe("sky");
    expect(cardTone("handover")).toBe("violet");
    expect(cardTitleKey("brief.overdueTasks")).toBe("overdueTasks");
    expect(cardTitleKey("brief.handover")).toBe("floorHandover");
    expect(sourceCopyKey("cash_variance")).toBe("sourceCash");
    expect(sourceCopyKey("handover")).toBe("sourceHandover");
    expect(cardDisplayValue({ kind: "cash_variance", detail: "-2000", count: 1 } as never)).toEqual({ kind: "cash", value: -2000 });
    expect(cardDisplayValue({ kind: "late_staff", count: 4 } as never)).toEqual({ kind: "count", value: 4 });
  });
});
