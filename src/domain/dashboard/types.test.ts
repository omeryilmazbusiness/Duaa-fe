import { describe, expect, it } from "vitest";
import { isBoundSource, isLiveTile, type DashboardTile } from "./types";

describe("dashboard tiles", () => {
  it("never treats an unwired POS tile as a live zero", () => {
    const sales: DashboardTile = {
      module: "sales",
      status: "unavailable",
      reasonKey: "dash.posNotWired",
      value: 0,
      labelKey: "sales",
    };
    expect(isBoundSource(sales)).toBe(false);
    expect(isLiveTile(sales)).toBe(false);
    expect(isBoundSource({ module: "occupancy", status: "unavailable", value: 0, labelKey: "occupancy" })).toBe(true);
  });

  it("lets a closed till become live", () => {
    const cash: DashboardTile = {
      module: "cash",
      status: "live",
      value: -2000,
      labelKey: "sourceCash",
    };
    expect(isLiveTile(cash)).toBe(true);
    expect(isBoundSource(cash)).toBe(false);
  });
});
