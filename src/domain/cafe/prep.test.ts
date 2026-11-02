import { describe, expect, it } from "vitest";
import { isLivePrep } from "./prep";

describe("prep day", () => {
  it("does not treat an empty day as live wait", () => {
    expect(isLivePrep({ status: "unavailable", ticketCount: 0 })).toBe(false);
    expect(isLivePrep({ status: "live", ticketCount: 0 })).toBe(false);
    expect(isLivePrep({ status: "live", ticketCount: 2 })).toBe(true);
  });
});
