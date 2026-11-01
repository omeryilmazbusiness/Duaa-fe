import { describe, expect, it } from "vitest";
import { cardDisplayValue, cardTitleKey, cardTone, emptyBriefKey, headlineParts, sourceCopyKey, TODAY_KPIS, todayKpis } from "./look";
import type { BriefView } from "./types";

function brief(over: Partial<BriefView> = {}): BriefView {
  return {
    generatedAt: "2026-11-01T00:00:00Z",
    date: "2026-11-01",
    workspaceKind: "cafe",
    headline: { overdueTasks: 0, pendingDecisions: 0, assignedFollowups: 0 },
    pulse: { overdueTasks: 0, openTasks: 0, completedToday: 0 },
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
    expect(todayKpis({ overdueTasks: 2, openTasks: 5, completedToday: 1 }).map((item) => item.value)).toEqual([2, 5, 1]);
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
    expect(emptyBriefKey(brief({ isClear: false, pulse: { overdueTasks: 3, openTasks: 3, completedToday: 0 }, snoozedCount: 2 }))).toBe(
      "handledUntilTomorrow",
    );
    expect(emptyBriefKey(brief({ isClear: false }))).toBe("noMorningCards");
  });

  it("maps card kind, title and cash display without inventing a live POS figure", () => {
    expect(cardTone("late_staff")).toBe("rose");
    expect(cardTone("customer_voice")).toBe("sky");
    expect(cardTitleKey("brief.overdueTasks")).toBe("overdueTasks");
    expect(sourceCopyKey("cash_variance")).toBe("sourceCash");
    expect(cardDisplayValue({ kind: "cash_variance", detail: "-2000", count: 1 } as never)).toEqual({ kind: "cash", value: -2000 });
    expect(cardDisplayValue({ kind: "late_staff", count: 4 } as never)).toEqual({ kind: "count", value: 4 });
  });
});
