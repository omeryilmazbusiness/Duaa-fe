import { describe, expect, it } from "vitest";
import type { CafeVoice } from "@/domain/cafe/qr";
import type { StockDay } from "@/domain/cafe/stock";
import type { ReportView } from "@/domain/report/types";
import { coffeeCornerFromLive, mapFaultsFromReports, mapRequestsFromLive, mapStockFromInventory } from "./from-live";

const NOW = Date.parse("2026-11-03T12:00:00.000Z");

function report(partial: Partial<ReportView> & Pick<ReportView, "id" | "kind" | "title" | "status" | "createdAt">): ReportView {
  return {
    detail: "",
    reporterUserId: "u1",
    reporterName: "Ali",
    updatedAt: partial.createdAt,
    ...partial,
  };
}

function voice(partial: Partial<CafeVoice> & Pick<CafeVoice, "id" | "kind" | "label" | "createdAt">): CafeVoice {
  return {
    siteId: "s1",
    area: "table",
    rating: 0,
    comment: "",
    contactName: "",
    contactPhone: "",
    unhappy: false,
    needsRecovery: false,
    recoveryId: "",
    recoveryStatus: "",
    assigneeUserId: "",
    linkedTaskId: "",
    compensationAmount: 0,
    compensationCurrency: "TRY",
    compensationLimit: 0,
    ackDue: "",
    resolveDue: "",
    lateAck: false,
    lateResolve: false,
    ...partial,
  };
}

describe("mapFaultsFromReports", () => {
  it("keeps only open breakage (arıza) and ages severity", () => {
    const faults = mapFaultsFromReports(
      [
        report({ id: "b1", kind: "breakage", title: "Grinder", status: "open", createdAt: "2026-11-03T11:30:00.000Z" }),
        report({ id: "b2", kind: "breakage", title: "Fridge", status: "resolved", createdAt: "2026-11-03T10:00:00.000Z" }),
        report({ id: "r1", kind: "request", title: "Napkins", status: "open", createdAt: "2026-11-03T11:00:00.000Z" }),
      ],
      NOW,
    );
    expect(faults).toHaveLength(1);
    expect(faults[0]?.id).toBe("b1");
    expect(faults[0]?.openedMinutesAgo).toBe(30);
    expect(faults[0]?.severity).toBe("critical");
  });
});

describe("mapRequestsFromLive", () => {
  it("merges open guest requests with open staff request reports", () => {
    const pending = mapRequestsFromLive(
      [
        voice({ id: "v1", kind: "request", label: "7", comment: "Bill please", createdAt: "2026-11-03T11:50:00.000Z" }),
        voice({ id: "v2", kind: "request", label: "3", comment: "Water", recoveryStatus: "closed", createdAt: "2026-11-03T11:00:00.000Z" }),
        voice({ id: "v3", kind: "review", label: "2", comment: "Nice", createdAt: "2026-11-03T11:55:00.000Z" }),
      ],
      [report({ id: "r1", kind: "request", title: "Extra spoons", status: "assigned", createdAt: "2026-11-03T11:40:00.000Z" })],
      NOW,
    );
    expect(pending.map((p) => p.id).sort()).toEqual(["report:r1", "voice:v1"]);
    expect(pending[0]?.waitingMinutes).toBeGreaterThanOrEqual(pending[1]?.waitingMinutes ?? 0);
  });
});

describe("mapStockFromInventory", () => {
  it("marks stock unavailable when catalog is empty", () => {
    const stock = mapStockFromInventory({
      status: "unavailable",
      items: [],
      adjustments: [],
      itemCount: 0,
      lowCount: 0,
    } as unknown as StockDay);
    expect(stock.available).toBe(false);
    expect(stock.items).toHaveLength(0);
  });

  it("prefers bar items and uses recorded levels", () => {
    const day: StockDay = {
      businessDate: "2026-11-03",
      timezone: "UTC",
      status: "live",
      itemCount: 2,
      lowCount: 1,
      canRecord: true,
      canEditCatalog: true,
      adjustments: [],
      items: [
        {
          id: "k1",
          name: "Flour",
          station: "kitchen",
          unit: "g",
          onHand: 100,
          par: 1000,
          level: 10,
          active: true,
          low: true,
        },
        {
          id: "b1",
          name: "Oat milk",
          station: "bar",
          unit: "ml",
          onHand: 1800,
          par: 3000,
          level: 60,
          active: true,
          low: true,
        },
      ],
    };
    const stock = mapStockFromInventory(day);
    expect(stock.available).toBe(true);
    expect(stock.items).toHaveLength(1);
    expect(stock.lowest?.id).toBe("b1");
    expect(stock.lowest?.level).toBe(60);
    expect(stock.severity).toBe("ok");
  });
});

describe("coffeeCornerFromLive", () => {
  it("composes the three streams", () => {
    const snap = coffeeCornerFromLive({
      nowMs: NOW,
      reports: [report({ id: "b1", kind: "breakage", title: "Grinder", status: "open", createdAt: "2026-11-03T11:55:00.000Z" })],
      voices: [voice({ id: "v1", kind: "request", label: "4", comment: "Refill", createdAt: "2026-11-03T11:58:00.000Z" })],
      stock: {
        businessDate: "2026-11-03",
        timezone: "UTC",
        status: "live",
        itemCount: 0,
        lowCount: 0,
        canRecord: true,
        canEditCatalog: true,
        items: [],
        adjustments: [],
      },
    });
    expect(snap.faults.open).toHaveLength(1);
    expect(snap.requests.pending).toHaveLength(1);
    expect(snap.stock.available).toBe(true);
    expect(snap.stock.items).toHaveLength(0);
  });
});
