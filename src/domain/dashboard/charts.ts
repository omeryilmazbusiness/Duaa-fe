import type { BriefPulse } from "@/domain/executive/types";
import type { CafeCard, HotelCard } from "@/domain/portfolio/types";
import type { Tone } from "@/theme/tones";
import type { DashboardPulse, DashboardSales, DashboardWaste } from "./types";

/** Copy keys the chart legends read from the locale messages. */
export type ChartLabelKey =
  | "overdue"
  | "open"
  | "completedToday"
  | "dashSegOnTrack"
  | "dashSegOccupied"
  | "dashSegVacant"
  | "hotelOoo"
  | "dashSegRooms"
  | "dashSegFb"
  | "dashSegOther"
  | "dashSegCash"
  | "dashSegCard"
  | "dashSegStockOk"
  | "dashSegStockLow"
  | "dashSegKitchen"
  | "dashSegBar"
  | "dashSegWaiting"
  | "dashSegReady"
  | "dashSegServed"
  | "dashSegDone"
  | "dashSegRemaining";

export interface ChartSegment {
  id: string;
  labelKey: ChartLabelKey;
  value: number;
  tone: Tone;
}

function whole(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function segmentTotal(segments: readonly ChartSegment[]): number {
  return segments.reduce((sum, s) => sum + whole(s.value), 0);
}

/** A chart is only drawn when at least one slice has something in it. */
export function hasChartData(segments: readonly ChartSegment[]): boolean {
  return segmentTotal(segments) > 0;
}

/** Share of one slice in the whole, as a whole percent. */
export function segmentPct(segment: ChartSegment, segments: readonly ChartSegment[]): number {
  const total = segmentTotal(segments);
  if (total === 0) return 0;
  return Math.round((whole(segment.value) / total) * 100);
}

/** Colour of a completeness figure: green when it is nearly there, amber when little is entered. */
export function completenessTone(pct: number): Tone {
  if (pct >= 80) return "emerald";
  if (pct >= 40) return "sky";
  return "amber";
}

/** Overdue is a subset of open on the backend, so the on-track slice is what is left of open. */
export function taskSegments(pulse: Pick<DashboardPulse, "openTasks" | "overdueTasks" | "completedToday">): ChartSegment[] {
  const overdue = whole(pulse.overdueTasks);
  const onTrack = Math.max(whole(pulse.openTasks) - overdue, 0);
  return [
    { id: "overdue", labelKey: "overdue", value: overdue, tone: "rose" },
    { id: "open", labelKey: "dashSegOnTrack", value: onTrack, tone: "sky" },
    { id: "done", labelKey: "completedToday", value: whole(pulse.completedToday), tone: "emerald" },
  ];
}

export function occupancySegments(hotel: Pick<HotelCard, "occupiedRooms" | "availableRooms" | "outOfOrderRooms">): ChartSegment[] {
  const occupied = whole(hotel.occupiedRooms);
  return [
    { id: "occupied", labelKey: "dashSegOccupied", value: occupied, tone: "indigo" },
    { id: "vacant", labelKey: "dashSegVacant", value: Math.max(whole(hotel.availableRooms) - occupied, 0), tone: "teal" },
    { id: "ooo", labelKey: "hotelOoo", value: whole(hotel.outOfOrderRooms), tone: "rose" },
  ];
}

export function revenueMixSegments(hotel: Pick<HotelCard, "roomRevenueMinor" | "fbRevenueMinor" | "otherRevenueMinor">): ChartSegment[] {
  return [
    { id: "rooms", labelKey: "dashSegRooms", value: whole(hotel.roomRevenueMinor), tone: "indigo" },
    { id: "fb", labelKey: "dashSegFb", value: whole(hotel.fbRevenueMinor), tone: "amber" },
    { id: "other", labelKey: "dashSegOther", value: whole(hotel.otherRevenueMinor), tone: "teal" },
  ];
}

export function salesMixSegments(sales: Pick<DashboardSales, "cash" | "card" | "other">): ChartSegment[] {
  return [
    { id: "cash", labelKey: "dashSegCash", value: whole(sales.cash), tone: "emerald" },
    { id: "card", labelKey: "dashSegCard", value: whole(sales.card), tone: "sky" },
    { id: "other", labelKey: "dashSegOther", value: whole(sales.other), tone: "violet" },
  ];
}

export function stockSegments(cafe: Pick<CafeCard, "stockItems" | "stockLowCount">): ChartSegment[] {
  const low = Math.min(whole(cafe.stockLowCount), whole(cafe.stockItems));
  return [
    { id: "ok", labelKey: "dashSegStockOk", value: Math.max(whole(cafe.stockItems) - low, 0), tone: "emerald" },
    { id: "low", labelKey: "dashSegStockLow", value: low, tone: "rose" },
  ];
}

export function wasteSegments(waste: Pick<DashboardWaste, "kitchenGrams" | "barGrams">): ChartSegment[] {
  return [
    { id: "kitchen", labelKey: "dashSegKitchen", value: whole(waste.kitchenGrams), tone: "amber" },
    { id: "bar", labelKey: "dashSegBar", value: whole(waste.barGrams), tone: "violet" },
  ];
}

export function prepSegments(pulse: Pick<BriefPulse, "waitingPrep" | "readyPrep" | "servedPrep">): ChartSegment[] {
  return [
    { id: "waiting", labelKey: "dashSegWaiting", value: whole(pulse.waitingPrep), tone: "amber" },
    { id: "ready", labelKey: "dashSegReady", value: whole(pulse.readyPrep), tone: "emerald" },
    { id: "served", labelKey: "dashSegServed", value: whole(pulse.servedPrep), tone: "sky" },
  ];
}

export function checklistSegments(pulse: Pick<BriefPulse, "openChecks" | "openDone" | "closeChecks" | "closeDone">): ChartSegment[] {
  const total = whole(pulse.openChecks) + whole(pulse.closeChecks);
  const done = Math.min(whole(pulse.openDone) + whole(pulse.closeDone), total);
  return [
    { id: "done", labelKey: "dashSegDone", value: done, tone: "emerald" },
    { id: "remaining", labelKey: "dashSegRemaining", value: total - done, tone: "indigo" },
  ];
}
