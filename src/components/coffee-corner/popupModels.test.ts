import { describe, expect, it } from "vitest";
import { messages } from "@/lib/i18n";
import { buildPopupModels } from "./popupModels";
import type { CoffeeCornerSnapshot } from "./types";
import { buildFaults, buildRequests, buildStock } from "./useCoffeeCornerData";

const t = messages("en");

function snapshot(): CoffeeCornerSnapshot {
  return {
    stock: buildStock([
      { item: "beans", level: 80 },
      { item: "milk", level: 12 },
    ]),
    requests: buildRequests([
      { id: "a", kind: "bill", table: 3, waitingMinutes: 11 },
      { id: "b", kind: "refill", table: 5, waitingMinutes: 2 },
    ]),
    faults: buildFaults([]),
    updatedAt: 0,
  };
}

describe("coffee corner builders", () => {
  it("flags the lowest stock item and its severity", () => {
    const { stock } = snapshot();
    expect(stock.lowest.item).toBe("milk");
    expect(stock.severity).toBe("critical");
  });

  it("escalates requests by the oldest wait", () => {
    expect(snapshot().requests.oldest?.id).toBe("a");
    expect(snapshot().requests.severity).toBe("critical");
  });

  it("reports ok when there are no faults", () => {
    expect(snapshot().faults.severity).toBe("ok");
    expect(snapshot().faults.worst).toBeNull();
  });
});

describe("buildPopupModels", () => {
  it("maps the three streams to localized popup props", () => {
    const m = buildPopupModels(snapshot(), t);
    expect(m.stock.value).toBe("12%");
    expect(m.stock.caption).toContain(t.ccItemMilk);
    expect(m.requests.rows?.[0]?.label).toContain(t.ccReqBill);
    expect(m.faults.caption).toBe(t.ccAllClear);
  });
});
