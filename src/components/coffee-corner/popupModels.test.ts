import { describe, expect, it } from "vitest";
import { buildFaults, buildRequests, buildStock, type CoffeeCornerSnapshot } from "@/domain/coffee-corner";
import { messages } from "@/lib/i18n";
import { buildPopupModels } from "./popupModels";

const t = messages("en");

function snapshot(over: Partial<CoffeeCornerSnapshot> = {}): CoffeeCornerSnapshot {
  return {
    stock: buildStock([{ id: "milk", label: "Milk", level: 12 }]),
    requests: buildRequests([
      { id: "a", label: "Bill", tableLabel: "3", waitingMinutes: 11, source: "voice" },
      { id: "b", label: "Refill", tableLabel: "5", waitingMinutes: 2, source: "voice" },
    ]),
    faults: buildFaults([]),
    updatedAt: 0,
    ...over,
  };
}

describe("buildPopupModels", () => {
  it("maps live free-form labels", () => {
    const m = buildPopupModels(snapshot(), t);
    expect(m.stock.value).toBe("12%");
    expect(m.stock.caption).toContain("Milk");
    expect(m.requests.rows?.[0]?.label).toContain("Bill");
    expect(m.faults.caption).toBe(t.ccAllClear);
  });

  it("keeps unique row ids when two faults share a device label", () => {
    const m = buildPopupModels(
      snapshot({
        faults: buildFaults([
          { id: "f1", label: "Grinder", severity: "warn", openedMinutesAgo: 5 },
          { id: "f2", label: "Grinder", severity: "critical", openedMinutesAgo: 1 },
        ]),
      }),
      t,
    );
    const ids = m.faults.rows?.map((r) => r.id) ?? [];
    expect(ids).toEqual(["f1", "f2"]);
  });

  it("shows an honest empty state when stock feed is unavailable", () => {
    const m = buildPopupModels(snapshot({ stock: buildStock([], false) }), t);
    expect(m.stock.value).toBe("—");
    expect(m.stock.caption).toBe(t.ccStockNoFeed);
  });
});
