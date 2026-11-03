import { describe, expect, it } from "vitest";
import { isLiveWaste } from "./waste";

describe("waste day", () => {
  it("does not treat an empty day as live fire", () => {
    expect(isLiveWaste({ status: "unavailable", ticketCount: 0 })).toBe(false);
    expect(isLiveWaste({ status: "live", ticketCount: 0 })).toBe(false);
    expect(isLiveWaste({ status: "live", ticketCount: 2 })).toBe(true);
  });
});
