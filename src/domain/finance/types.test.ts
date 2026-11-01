import { describe, expect, it } from "vitest";
import { canApprove, isPendingApproval, parseIQD } from "./types";

describe("spend pack stage 2", () => {
  it("does not treat approve as a payment — it only needs evidence on an open pack", () => {
    expect(canApprove({ status: "open", evidence: "photo" })).toBe(true);
    expect(canApprove({ status: "open" })).toBe(false);
    expect(canApprove({ status: "needs_evidence", evidence: "old-slip" })).toBe(false);
    expect(canApprove({ status: "approved", evidence: "photo" })).toBe(false);
  });

  it("keeps needs_evidence in the pending inbox", () => {
    expect(isPendingApproval({ status: "needs_evidence" })).toBe(true);
    expect(isPendingApproval({ status: "approved" })).toBe(false);
  });

  it("rejects fractional IQD", () => {
    expect(parseIQD("250000")).toBe(250000);
    expect(parseIQD("12.5")).toBeNull();
  });
});
