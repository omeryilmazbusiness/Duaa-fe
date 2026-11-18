import { describe, expect, it } from "vitest";
import {
  checklistSegments,
  completenessTone,
  hasChartData,
  occupancySegments,
  prepSegments,
  revenueMixSegments,
  salesMixSegments,
  segmentPct,
  segmentTotal,
  stockSegments,
  taskSegments,
  wasteSegments,
} from "./charts";

const value = (segments: ReturnType<typeof taskSegments>, id: string) => segments.find((s) => s.id === id)?.value;

describe("taskSegments", () => {
  it("treats overdue as part of open", () => {
    const s = taskSegments({ openTasks: 5, overdueTasks: 2, completedToday: 3 });
    expect([value(s, "overdue"), value(s, "open"), value(s, "done")]).toEqual([2, 3, 3]);
  });

  it("never goes negative when the feed is inconsistent", () => {
    const s = taskSegments({ openTasks: 1, overdueTasks: 4, completedToday: 0 });
    expect(value(s, "open")).toBe(0);
  });

  it("has no data when everything is zero", () => {
    expect(hasChartData(taskSegments({ openTasks: 0, overdueTasks: 0, completedToday: 0 }))).toBe(false);
  });
});

describe("hotel segments", () => {
  it("splits rooms into occupied, vacant and out of order", () => {
    const s = occupancySegments({ occupiedRooms: 90, availableRooms: 130, outOfOrderRooms: 10 });
    expect(s.map((x) => x.value)).toEqual([90, 40, 10]);
    expect(segmentTotal(s)).toBe(140);
  });

  it("splits revenue by department", () => {
    const s = revenueMixSegments({ roomRevenueMinor: 600, fbRevenueMinor: 300, otherRevenueMinor: 100 });
    expect(segmentPct(s[0]!, s)).toBe(60);
    expect(segmentPct(s[1]!, s)).toBe(30);
    expect(segmentPct(s[2]!, s)).toBe(10);
  });
});

describe("cafe segments", () => {
  it("splits sales by payment method", () => {
    const s = salesMixSegments({ cash: 5000, card: 3000, other: 0 });
    expect(s.map((x) => x.value)).toEqual([5000, 3000, 0]);
  });

  it("caps low stock at the item count", () => {
    const s = stockSegments({ stockItems: 3, stockLowCount: 9 });
    expect(s.map((x) => x.value)).toEqual([0, 3]);
  });

  it("splits waste by station", () => {
    expect(wasteSegments({ kitchenGrams: 400, barGrams: 100 }).map((x) => x.value)).toEqual([400, 100]);
  });

  it("splits prep tickets by state", () => {
    expect(prepSegments({ waitingPrep: 1, readyPrep: 2, servedPrep: 3 }).map((x) => x.value)).toEqual([1, 2, 3]);
  });

  it("counts checklist items done against remaining across open and close lists", () => {
    const s = checklistSegments({ openChecks: 5, openDone: 5, closeChecks: 5, closeDone: 2 });
    expect(s.map((x) => x.value)).toEqual([7, 3]);
  });
});

describe("completenessTone", () => {
  it("maps thresholds", () => {
    expect([completenessTone(100), completenessTone(80), completenessTone(79), completenessTone(40), completenessTone(39)]).toEqual([
      "emerald",
      "emerald",
      "sky",
      "sky",
      "amber",
    ]);
  });
});
