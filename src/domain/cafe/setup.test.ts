import { describe, expect, it } from "vitest";
import {
  buildSetupOverview,
  cafeStepValid,
  initialStep,
  isStepLocked,
  neighborStep,
  type CafeSetupOverview,
} from "./setup";
import { emptySLA, type CafeDefinition } from "./definition";

function def(over: Partial<CafeDefinition> = {}): CafeDefinition {
  return {
    workspaceId: "w1",
    displayName: "",
    currency: "",
    timezone: "",
    posVendor: "",
    posStatus: "unknown",
    branches: [],
    qrSites: [],
    shifts: [],
    sla: emptySLA(),
    completeness: {
      readyForReviews: false,
      hasName: false,
      hasTimezone: false,
      hasCurrency: false,
      hasBranch: false,
      hasQRSite: false,
      hasSLA: false,
      missing: ["name", "timezone", "currency", "branch", "qr_site", "sla"],
    },
    canWrite: true,
    persisted: false,
    updatedAt: "",
    ...over,
  };
}

describe("cafe setup flow", () => {
  it("starts on cafe and locks later steps until identity is saved", () => {
    const overview = buildSetupOverview(def(), { aiConfigured: false, aiSkipped: false });
    expect(initialStep(overview)).toBe("cafe");
    expect(isStepLocked(overview, "branches")).toBe(true);
    expect(isStepLocked(overview, "ai")).toBe(true);
  });

  it("unlocks tables only after branches are recorded", () => {
    const overview = buildSetupOverview(
      def({
        displayName: "Duaa Cafe",
        timezone: "Asia/Baghdad",
        currency: "IQD",
        branches: [{ id: "b1", name: "Main", address: "", active: true }],
      }),
      { aiConfigured: false, aiSkipped: false },
    );
    expect(initialStep(overview)).toBe("tables");
    expect(isStepLocked(overview, "tables")).toBe(false);
    expect(isStepLocked(overview, "sla")).toBe(true);
  });

  it("opens AI after workshop is ready, then summary when AI is skipped", () => {
    const ready = def({
      displayName: "Duaa Cafe",
      timezone: "Asia/Baghdad",
      currency: "IQD",
      branches: [{ id: "b1", name: "Main", address: "", active: true }],
      qrSites: [{ id: "q1", branchId: "b1", label: "12", area: "table", active: true }],
      sla: { ...emptySLA(), ackMinutes: 15 },
    });
    const openAi = buildSetupOverview(ready, { aiConfigured: false, aiSkipped: false });
    expect(openAi.workshopReady).toBe(true);
    expect(initialStep(openAi)).toBe("ai");
    const done = buildSetupOverview(ready, { aiConfigured: false, aiSkipped: true });
    expect(done.completed).toBe(true);
    expect(initialStep(done)).toBeNull();
  });

  it("validates cafe identity without inventing branch or SLA", () => {
    expect(cafeStepValid({ displayName: "Duaa", timezone: "Asia/Baghdad", currency: "IQD" })).toBe(true);
    expect(cafeStepValid({ displayName: "", timezone: "Asia/Baghdad", currency: "IQD" })).toBe(false);
  });

  it("moves neighbor steps forward and back", () => {
    const o: CafeSetupOverview = buildSetupOverview(
      def({ displayName: "Duaa", timezone: "Asia/Baghdad", currency: "IQD" }),
      { aiConfigured: false, aiSkipped: false },
    );
    expect(neighborStep(o, "cafe", 1)).toBe("branches");
    expect(neighborStep(o, "cafe", -1)).toBeNull();
  });
});
