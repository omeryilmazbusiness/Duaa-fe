import { describe, expect, it } from "vitest";
import { allowedActions, can } from "./actions";

describe("decision actions", () => {
  it("lets the GM act on a fresh card", () => {
    expect(allowedActions(null)).toEqual(["acknowledge", "assign", "resolve"]);
    expect(can("open", "assign")).toBe(true);
  });

  it("closes the queue after resolve", () => {
    expect(allowedActions("resolved")).toEqual([]);
    expect(can("resolved", "assign")).toBe(false);
  });
});
