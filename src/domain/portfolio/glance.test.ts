import { describe, expect, it } from "vitest";
import { buildGlance, glanceWarnings } from "./glance";
import type { CafeCard, HotelCard, PortfolioView } from "./types";

function hotel(over: Partial<HotelCard>): HotelCard {
  return {
    workspaceId: "h1",
    name: "Sheraton",
    slug: "sheraton",
    businessDate: "2026-11-18",
    freshness: "current",
    currency: "USD",
    totalRooms: 250,
    availableRooms: 245,
    occupiedRooms: 200,
    outOfOrderRooms: 5,
    occupancyPct: 82,
    roomRevenueMinor: 0,
    fbRevenueMinor: 0,
    otherRevenueMinor: 0,
    totalRevenueMinor: 0,
    adrMinor: 0,
    revparMinor: 0,
    arrivalsCount: 0,
    departuresCount: 0,
    reservationsCount: 0,
    yesterdayRevenueMinor: 0,
    hasYesterday: false,
    revenueDeltaMinor: 0,
    readinessPct: 0,
    completenessPct: 0,
    openTasks: 0,
    overdueTasks: 0,
    openReports: 0,
    ohipConfigured: false,
    ohipLastSyncStatus: "never",
    ...over,
  };
}

function cafe(over: Partial<CafeCard>): CafeCard {
  return {
    workspaceId: "c1",
    name: "DUA Cafe",
    slug: "cafe",
    businessDate: "2026-11-18",
    salesStatus: "live",
    salesNet: 1_200_000,
    salesGross: 1_250_000,
    ticketCount: 140,
    posClosed: false,
    wasteStatus: "unavailable",
    wasteCost: 0,
    wasteGrams: 0,
    stockStatus: "live",
    stockItems: 40,
    stockLowCount: 0,
    cashStatus: "unavailable",
    cashVariance: 0,
    profitability: { status: "unavailable", currency: "IQD", salesNet: 0, wasteCost: 0, approvedExpenses: 0, pendingApprovalsCount: 0, estimatedNet: 0, complete: false },
    completenessPct: 90,
    openTasks: 0,
    overdueTasks: 0,
    openReports: 0,
    openRecoveries: 0,
    ...over,
  };
}

function portfolio(hotels: HotelCard[], cafes: CafeCard[], pct = 90): PortfolioView {
  return {
    generatedAt: "",
    date: "2026-11-18",
    workspaceCount: hotels.length + cafes.length,
    completeness: { overallPct: pct, byWorkspace: [] },
    hotels: {
      count: hotels.length,
      connectedCount: hotels.length,
      avgOccupancyPct: 82,
      totalRooms: 250,
      availableRooms: 245,
      occupiedRooms: 200,
      outOfOrderRooms: 5,
      totalArrivals: 12,
      totalDepartures: 9,
      totalsByCurrency: [
        { currency: "USD", hotelCount: 1, todayTotalRevenueMinor: 5_000_00, todayRoomRevenueMinor: 0, yesterdayRevenueMinor: 4_000_00, hasYesterday: true, deltaMinor: 1_000_00, deltaPct: 25 },
      ],
      hotels,
    },
    cafes: { count: cafes.length, cafes },
    recentDocuments: [],
  };
}

describe("buildGlance", () => {
  it("reports an all-clear day in plain items", () => {
    const items = buildGlance(portfolio([hotel({})], [cafe({})]));
    expect(items.map((i) => i.id)).toEqual(["hotel_revenue", "cafe_sales", "all_clear"]);
    expect(glanceWarnings(items)).toBe(0);
  });

  it("puts problems first", () => {
    const items = buildGlance(
      portfolio([hotel({}), hotel({ workspaceId: "h2", name: "Al Shohada", freshness: "unavailable" })], [cafe({ salesStatus: "unavailable", stockLowCount: 3 })], 20),
      2,
    );
    expect(items.slice(0, 5).map((i) => i.id)).toEqual(["overdue", "hotel_missing", "cafe_no_sales", "cafe_low_stock", "completeness"]);
    expect(items.find((i) => i.id === "hotel_missing")).toMatchObject({ names: ["Al Shohada"] });
    expect(items.some((i) => i.id === "all_clear")).toBe(false);
    expect(glanceWarnings(items)).toBe(5);
  });

  it("flags falling hotel revenue", () => {
    const p = portfolio([hotel({})], []);
    p.hotels.totalsByCurrency = [{ ...p.hotels.totalsByCurrency[0]!, deltaPct: -10, deltaMinor: -50_00 }];
    expect(buildGlance(p)[0]).toMatchObject({ id: "hotel_revenue", tone: "warn", deltaPct: -10 });
  });
});
