import { describe, expect, it } from "vitest";
import { isLiveStock } from "./stock";

describe("isLiveStock", () => {
  it("requires live status and at least one item", () => {
    expect(isLiveStock({ status: "unavailable", itemCount: 0 })).toBe(false);
    expect(isLiveStock({ status: "live", itemCount: 0 })).toBe(false);
    expect(isLiveStock({ status: "live", itemCount: 2 })).toBe(true);
  });
});
