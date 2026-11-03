import { describe, expect, it } from "vitest";
import type { CafeVoice } from "@/domain/cafe/qr";
import type { WasteDay } from "@/domain/cafe/waste";
import type { ReportView } from "@/domain/report/types";
import { coffeeCornerFromLive, mapFaultsFromReports, mapRequestsFromLive, mapStockFromWaste } from "./from-live";

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

describe("mapStockFromWaste", () => {
  it("marks stock unavailable when waste feed is down", () => {
    const stock = mapStockFromWaste({ status: "unavailable", recipes: [], tickets: [] } as unknown as WasteDay);
    expect(stock.available).toBe(false);
    expect(stock.items).toHaveLength(0);
  });

  it("derives bar recipe health from waste grams", () => {
    const waste: WasteDay = {
      businessDate: "2026-11-03",
      timezone: "UTC",
      status: "live",
      ticketCount: 1,
      grams: 200,
      cost: 10,
      kitchenGrams: 0,
      barGrams: 200,
      canRecord: true,
      canEditRecipes: true,
      recipes: [
        {
          id: "rec1",
          name: "Flat white",
          station: "bar",
          lines: [{ title: "Milk", grams: 50 }],
        },
      ],
      tickets: [
        {
          id: "t1",
          item: "Flat white",
          station: "bar",
          grams: 200,
          cost: 10,
          reason: "spoilage",
          recipeId: "rec1",
          recordedAt: "2026-11-03T10:00:00.000Z",
          businessDate: "2026-11-03",
        },
      ],
    };
    // par = max(50*8, 400) = 400; level = 100 - 200/400*100 = 50
    const stock = mapStockFromWaste(waste);
    expect(stock.available).toBe(true);
    expect(stock.lowest?.level).toBe(50);
    expect(stock.severity).toBe("ok");
  });
});

describe("coffeeCornerFromLive", () => {
  it("composes the three streams", () => {
    const snap = coffeeCornerFromLive({
      nowMs: NOW,
      reports: [report({ id: "b1", kind: "breakage", title: "Grinder", status: "open", createdAt: "2026-11-03T11:55:00.000Z" })],
      voices: [voice({ id: "v1", kind: "request", label: "4", comment: "Refill", createdAt: "2026-11-03T11:58:00.000Z" })],
      waste: {
        businessDate: "2026-11-03",
        timezone: "UTC",
        status: "live",
        ticketCount: 0,
        grams: 0,
        cost: 0,
        kitchenGrams: 0,
        barGrams: 0,
        canRecord: true,
        canEditRecipes: true,
        recipes: [],
        tickets: [],
      },
    });
    expect(snap.faults.open).toHaveLength(1);
    expect(snap.requests.pending).toHaveLength(1);
    expect(snap.stock.available).toBe(true);
    expect(snap.stock.items).toHaveLength(0);
  });
});
