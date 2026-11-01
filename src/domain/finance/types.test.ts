import { describe, expect, it } from "vitest";
import { isPendingApproval, parseIQD, type SpendApproval } from "./types";

describe("finance money", () => {
  it("rejects floats and negatives so IQD never becomes a float", () => {
    expect(parseIQD("98000")).toBe(98000);
    expect(parseIQD("0")).toBe(0);
    expect(parseIQD("98.5")).toBeNull();
    expect(parseIQD("-1")).toBeNull();
    expect(parseIQD("")).toBeNull();
    expect(parseIQD("1e3")).toBeNull();
  });

  it("treats evidence requests as still pending a GM act", () => {
    const pack: SpendApproval = {
      id: "a1",
      title: "Milk",
      supplier: "Al-Nahrain",
      amount: 250000,
      currency: "IQD",
      status: "needs_evidence",
      createdAt: "",
      updatedAt: "",
    };
    expect(isPendingApproval(pack)).toBe(true);
    expect(isPendingApproval({ ...pack, status: "approved" })).toBe(false);
  });
});
