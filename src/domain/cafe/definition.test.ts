import { describe, expect, it } from "vitest";
import {
  isCafeArea,
  isCafePOSStatus,
  newBranch,
  newQRSite,
  previewCompleteness,
  toCafeSave,
  type CafeDefinition,
} from "./definition";

function sample(): CafeDefinition {
  return {
    workspaceId: "22222222-2222-4222-8222-222222222222",
    displayName: " Duaa Cafe ",
    currency: "iqd",
    timezone: "Asia/Baghdad",
    posVendor: " Foodics ",
    posStatus: "named",
    branches: [{ id: "b1", name: " Karada ", address: " ", active: true }],
    qrSites: [{ id: "q1", branchId: "b1", label: " Garden 4 ", area: "garden", active: true }],
    shifts: [{ id: "s1", name: " Morning ", start: "08:00", end: "16:00" }],
    sla: { ackMinutes: 15, resolveMinutes: 120, afterHoursMessage: " Call. ", compensationLimit: 0, compensationCurrency: "" },
    completeness: {
      readyForReviews: false,
      hasName: true,
      hasTimezone: true,
      hasCurrency: true,
      hasBranch: true,
      hasQRSite: true,
      hasSLA: true,
      missing: [],
    },
    canWrite: true,
    persisted: false,
    updatedAt: "",
  };
}

describe("cafe definition", () => {
  it("accepts known areas and POS statuses only", () => {
    expect(isCafeArea("garden")).toBe(true);
    expect(isCafeArea("rooftop")).toBe(false);
    expect(isCafePOSStatus("named")).toBe(true);
    expect(isCafePOSStatus("connected")).toBe(false);
  });

  it("builds a save payload without completeness or live POS", () => {
    const body = toCafeSave(sample());
    expect(body.displayName).toBe("Duaa Cafe");
    expect(body.currency).toBe("IQD");
    expect(body.posVendor).toBe("Foodics");
    expect(body.branches[0]?.name).toBe("Karada");
    expect(body.qrSites[0]?.label).toBe("Garden 4");
    expect("completeness" in body).toBe(false);
    expect("canWrite" in body).toBe(false);
  });

  it("clears vendor unless POS is named", () => {
    const none = toCafeSave({ ...sample(), posStatus: "none" });
    expect(none.posVendor).toBe("");
  });

  it("allocates client ids for new rows", () => {
    expect(newBranch().id).toMatch(/-/);
    expect(newQRSite("b1").branchId).toBe("b1");
  });

  it("previews review-readiness without inventing live POS", () => {
    const ready = previewCompleteness(sample());
    expect(ready.readyForReviews).toBe(true);
    expect(previewCompleteness({ ...sample(), currency: "" }).missing).toContain("currency");
  });
});
