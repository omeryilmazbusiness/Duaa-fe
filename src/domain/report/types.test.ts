import { describe, expect, it } from "vitest";
import { isOpenReport, type ReportView } from "./types";

function report(status: ReportView["status"]): ReportView {
  return {
    id: "1",
    kind: "breakage",
    title: "x",
    detail: "",
    status,
    reporterUserId: "u",
    reporterName: "Ali",
    createdAt: "",
    updatedAt: "",
  };
}

describe("report status", () => {
  it("keeps assigned reports in the inbox until resolved", () => {
    expect(isOpenReport(report("open"))).toBe(true);
    expect(isOpenReport(report("assigned"))).toBe(true);
    expect(isOpenReport(report("resolved"))).toBe(false);
  });
});
