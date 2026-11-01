import { describe, expect, it } from "vitest";
import { isLivePOS } from "./pos";

describe("POS day", () => {
  it("does not treat an empty day as live sales", () => {
    expect(isLivePOS({ status: "unavailable", ticketCount: 0 })).toBe(false);
    expect(isLivePOS({ status: "live", ticketCount: 0 })).toBe(false);
    expect(isLivePOS({ status: "live", ticketCount: 2 })).toBe(true);
  });
});
