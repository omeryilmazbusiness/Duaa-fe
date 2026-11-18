import { describe, expect, it } from "vitest";
import { formatMinorMoney } from "./pms";

describe("formatMinorMoney", () => {
  it("formats USD cents cleanly and keeps IQD whole", () => {
    expect(formatMinorMoney(25000_00, "USD", "en-US")).toContain("25,000");
    expect(formatMinorMoney(120000, "IQD", "en-US")).toContain("120,000");
  });
});
