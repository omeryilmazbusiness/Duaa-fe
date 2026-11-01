import { describe, expect, it } from "vitest";
import { cafeCatalog } from "./cafe";
import { hotelCatalog } from "./hotel";
import { supplyCatalog } from "./supply";
import { catalogFor, registeredKinds } from "./registry";

describe("vertical catalogs", () => {
  it("registers cafe, hotel and supply", () => {
    expect(registeredKinds()).toEqual(["cafe", "hotel", "supply"]);
    expect(catalogFor("cafe").kind).toBe("cafe");
  });

  it("cafe GM omits reservations and rooms", () => {
    expect(cafeCatalog.gmTabs()).toEqual(["dashboard", "today", "ops", "feedback"]);
    expect(cafeCatalog.gmTabs()).not.toContain("reservations");
    expect(cafeCatalog.floorOpsDepartment()).toBe("SERVICE");
    expect(cafeCatalog.executiveSignals()).toEqual(["handover", "late_staff", "customer_voice", "breakdown", "daily_close", "cash_variance"]);
    expect(cafeCatalog.executiveSignals()).not.toContain("reservations");
    expect(cafeCatalog.dashboardModules()).toEqual(["pulse", "reports", "cash", "approvals", "sales", "waste"]);
    expect(cafeCatalog.dashboardModules()).not.toContain("occupancy");
  });

  it("hotel GM keeps Guest-pro reservations tab", () => {
    expect(hotelCatalog.gmTabs()).toEqual(["today", "ops", "dashboard", "reservations", "feedback"]);
    expect(hotelCatalog.floorOpsDepartment()).toBe("RECEPTION");
    expect(hotelCatalog.floorOpsTabs()).toEqual(["guests", "live_chat", "requests"]);
    expect(hotelCatalog.dashboardModules()).toEqual(["pulse", "occupancy", "approvals"]);
    expect(hotelCatalog.dashboardModules()).not.toContain("sales");
  });

  it("supply GM has no feedback tab", () => {
    expect(supplyCatalog.gmTabs()).toEqual(["today", "ops", "dashboard"]);
    expect(supplyCatalog.floorOpsDepartment()).toBe("SALES");
  });
});
