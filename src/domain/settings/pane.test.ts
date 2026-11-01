import { describe, expect, it } from "vitest";
import { parseSettingsPane, settingsQuery } from "./pane";
import { personInitials } from "@/domain/session/types";

describe("settings panes", () => {
  it("accepts known panes and falls back to root", () => {
    expect(parseSettingsPane("ai")).toBe("ai");
    expect(parseSettingsPane("TEAM")).toBe("team");
    expect(parseSettingsPane("language")).toBe("language");
    expect(parseSettingsPane(null)).toBe("root");
    expect(parseSettingsPane("wallet")).toBe("root");
  });

  it("builds a stable settings query", () => {
    expect(settingsQuery("root")).toBe("view=settings");
    expect(settingsQuery("ai")).toBe("view=settings&pane=ai");
  });
});

describe("person initials", () => {
  it("builds a two-letter monogram", () => {
    expect(personInitials("Duaa", "Al-Hayani")).toBe("DA");
    expect(personInitials("", "")).toBe("?");
  });
});
