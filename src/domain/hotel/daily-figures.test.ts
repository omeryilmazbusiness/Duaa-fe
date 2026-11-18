import { describe, expect, it } from "vitest";
import { buildDailyFigures, majorToMinor, minorToMajor, parseAmount, parseCount, type DailyFiguresDraft } from "./pms";

const draft: DailyFiguresDraft = {
  totalRooms: "250",
  occupiedRooms: "180",
  outOfOrderRooms: "5",
  roomRevenue: "18 000,50",
  fbRevenue: "4200",
  otherRevenue: "",
  arrivals: "40",
  departures: "35",
  inHouseGuests: "310",
};

describe("parseAmount / parseCount", () => {
  it("accepts common typed formats", () => {
    expect(parseAmount("18000.50")).toBe(18000.5);
    expect(parseAmount("18 000,50")).toBe(18000.5);
    expect(parseAmount("1,250,000")).toBe(1250000);
    expect(parseAmount("")).toBe(0);
  });

  it("rejects letters and negatives", () => {
    expect(parseAmount("12a")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseCount("3.5")).toBeNull();
    expect(parseCount("-1")).toBeNull();
    expect(parseCount(" 12 ")).toBe(12);
  });
});

describe("money minor units", () => {
  it("treats IQD as whole dinar and other currencies as cents", () => {
    expect(majorToMinor(1500, "IQD")).toBe(1500);
    expect(majorToMinor(12.345, "USD")).toBe(1235);
    expect(minorToMajor(1235, "USD")).toBe(12.35);
    expect(minorToMajor(1500, "IQD")).toBe(1500);
  });
});

describe("buildDailyFigures", () => {
  it("builds the import payload in minor units", () => {
    const res = buildDailyFigures(draft, "USD");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toMatchObject({
      totalRooms: 250,
      occupiedRooms: 180,
      outOfOrderRooms: 5,
      roomRevenueMinor: 1800050,
      fbRevenueMinor: 420000,
      otherRevenueMinor: 0,
      arrivalsCount: 40,
      departuresCount: 35,
      inHouseGuests: 310,
    });
  });

  it("enforces the backend room rules", () => {
    expect(buildDailyFigures({ ...draft, totalRooms: "0" }, "USD")).toEqual({ ok: false, issue: "rooms_required" });
    expect(buildDailyFigures({ ...draft, outOfOrderRooms: "300" }, "USD")).toEqual({ ok: false, issue: "ooo_exceeds_total" });
    expect(buildDailyFigures({ ...draft, occupiedRooms: "248" }, "USD")).toEqual({ ok: false, issue: "occupied_exceeds_available" });
    expect(buildDailyFigures({ ...draft, fbRevenue: "abc" }, "USD")).toEqual({ ok: false, issue: "invalid_number" });
  });
});
