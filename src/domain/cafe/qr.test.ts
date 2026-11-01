import { describe, expect, it } from "vitest";
import { isValidQRToken, parseTableNumber, tableHeading } from "./qr";

describe("QR token", () => {
  it("accepts a 22-character public token", () => {
    expect(isValidQRToken("abcdefghijabcdefghijab")).toBe(true);
    expect(isValidQRToken("short")).toBe(false);
    expect(isValidQRToken("")).toBe(false);
  });
});

describe("table number", () => {
  it("is a name, not a token", () => {
    expect(parseTableNumber("  12a  ")).toBe("12a");
    expect(parseTableNumber("")).toBeNull();
    expect(parseTableNumber("***")).toBeNull();
    expect(tableHeading("12", "table", "Table")).toBe("Table 12");
    expect(tableHeading("Garden 4", "garden", "Table")).toBe("Garden 4");
  });
});
