import { describe, expect, it } from "vitest";
import { canAcceptHandover, canOpenHandover, toHandoverOpen } from "./handover";

describe("shift handover", () => {
  it("lets the outgoing manager open an empty snapshot", () => {
    expect(canOpenHandover({ canWrite: true, persisted: false })).toBe(true);
    expect(canOpenHandover({ canWrite: false, persisted: false })).toBe(false);
    expect(canOpenHandover({ canWrite: true, persisted: true })).toBe(false);
  });

  it("lets the incoming manager accept only an open file", () => {
    expect(canAcceptHandover({ canWrite: true, persisted: true, status: "open" })).toBe(true);
    expect(canAcceptHandover({ canWrite: true, persisted: true, status: "accepted" })).toBe(false);
    expect(canAcceptHandover({ canWrite: true, persisted: false, status: "" })).toBe(false);
  });

  it("drops blank shifts so the floor cannot invent one", () => {
    expect(toHandoverOpen({ businessDate: "2026-11-02", fromShift: "  ", toShift: "Evening", note: "keys" })).toEqual({
      businessDate: "2026-11-02",
      fromShift: undefined,
      toShift: "Evening",
      note: "keys",
    });
  });
});
