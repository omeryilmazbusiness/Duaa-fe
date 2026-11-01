import { describe, expect, it } from "vitest";
import { canSaveIntake, toIntakeSave } from "./intake";

describe("daily intake", () => {
  it("does not invent a close from empty boxes", () => {
    expect(canSaveIntake({ closeNote: "", wasteNote: " ", incidentNote: "", canWrite: true })).toBe(false);
    expect(canSaveIntake({ closeNote: "ok", wasteNote: "", incidentNote: "", canWrite: false })).toBe(false);
    expect(canSaveIntake({ closeNote: "quiet close", wasteNote: "", incidentNote: "", canWrite: true })).toBe(true);
  });

  it("drops a blank shift so the floor cannot invent one", () => {
    expect(toIntakeSave({ businessDate: "2026-11-01", shiftName: "  ", closeNote: "ok", wasteNote: "", incidentNote: "" })).toEqual({
      businessDate: "2026-11-01",
      shiftName: undefined,
      closeNote: "ok",
      wasteNote: "",
      incidentNote: "",
    });
  });
});
