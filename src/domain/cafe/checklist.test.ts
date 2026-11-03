import { describe, expect, it } from "vitest";
import { canSaveChecklist, remainingChecks, toChecklistSave } from "./checklist";

describe("cafe checklist", () => {
  it("empty list has no remaining work", () => {
    expect(remainingChecks({ open: { total: 0, done: 0, remaining: 0 }, close: { total: 0, done: 0, remaining: 0 } })).toBe(0);
  });

  it("counts only recorded remaining ticks", () => {
    expect(remainingChecks({ open: { total: 2, done: 1, remaining: 1 }, close: { total: 1, done: 0, remaining: 1 } })).toBe(2);
  });

  it("drops blank and maintenance lines on save", () => {
    expect(
      toChecklistSave([
        { kind: "open", title: "  " },
        { kind: "open", title: "chairs down" },
        { kind: "close", title: "safe locked" },
      ]),
    ).toEqual([
      { id: undefined, kind: "open", title: "chairs down", active: undefined },
      { id: undefined, kind: "close", title: "safe locked", active: undefined },
    ]);
  });

  it("does not let a viewer invent a list", () => {
    expect(canSaveChecklist({ canEdit: false, titles: ["chairs"] })).toBe(false);
    expect(canSaveChecklist({ canEdit: true, titles: ["x"] })).toBe(false);
    expect(canSaveChecklist({ canEdit: true, titles: ["chairs down", ""] })).toBe(true);
  });
});
