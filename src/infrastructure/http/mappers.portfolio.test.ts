import { describe, expect, it } from "vitest";
import {
  mapHotelPMS,
  mapMeetingView,
  mapPortfolioView,
  mapTranslateView,
  mapWorkspaceDocument,
} from "./mappers";

describe("portfolio & voice mappers", () => {
  it("maps portfolio view with completeness, hotels and cafe without mixing currencies", () => {
    const view = mapPortfolioView({
      date: "2026-11-18",
      workspaceCount: 3,
      completeness: {
        overallPct: 62,
        byWorkspace: [
          { workspaceId: "h1", workspaceName: "Sheraton Hotel", kind: "hotel", enteredCount: 4, expectedCount: 5, pct: 80, channels: [] },
        ],
      },
      hotels: {
        count: 2,
        connectedCount: 2,
        avgOccupancyPct: 75,
        totalsByCurrency: [
          { currency: "USD", hotelCount: 2, todayTotalRevenueMinor: 4000000, yesterdayRevenueMinor: 3000000, hasYesterday: true, deltaMinor: 1000000, deltaPct: 33.3 },
        ],
        hotels: [],
      },
      cafes: { count: 1, cafes: [] },
      recentDocuments: [],
    });
    expect(view.completeness.overallPct).toBe(62);
    expect(view.hotels.totalsByCurrency[0]?.currency).toBe("USD");
    expect(view.hotels.totalsByCurrency[0]?.deltaPct).toBe(33.3);
  });

  it("maps hotel PMS snapshot, documents, translations and meetings", () => {
    const pms = mapHotelPMS({
      workspaceId: "h1",
      workspaceName: "Sheraton Hotel",
      freshness: "stale",
      connector: { configured: true, enabled: true, syncMode: "ohip_api", lastSyncStatus: "error" },
      today: { id: "s1", businessDate: "2026-11-18", currency: "USD", totalRooms: 100, occupiedRooms: 80, occupancyPct: 80, totalRevenueMinor: 2000000 },
    });
    expect(pms.freshness).toBe("stale");
    expect(pms.today?.occupancyPct).toBe(80);

    const doc = mapWorkspaceDocument({
      id: "d1",
      workspaceId: "h1",
      businessDate: "2026-11-18",
      fileName: "opera.csv",
      sourceKind: "csv",
      status: "analyzed",
      aiUsed: true,
      dataCoveragePct: 95,
      summary: { headline: "Summary", keyMetrics: [{ label: "Rows", value: "10" }], takeaways: ["ok"], risks: [], actions: [], dataCoveragePct: 95 },
    });
    expect(doc.aiUsed).toBe(true);
    expect(doc.dataCoveragePct).toBe(95);

    const tr = mapTranslateView({
      translated: "مرحباً",
      simpleExplanation: "شرح مبسط",
      sourceLang: "en",
      targetLang: "ar",
      mode: "explain_term",
      usage: { used: 1, limit: 30, remaining: 29, resetsAt: "" },
    });
    expect(tr.mode).toBe("explain_term");
    expect(tr.simpleExplanation).toBe("شرح مبسط");

    const mt = mapMeetingView({
      id: "m1",
      title: "Morning Review",
      summary: "Summary",
      decisions: [{ text: "Approve", ambiguous: true }],
      actionItems: [{ text: "Send report", owner: "Ali", ambiguous: false }],
    });
    expect(mt.decisions[0]?.ambiguous).toBe(true);
    expect(mt.actionItems[0]?.owner).toBe("Ali");
  });
});
