import { describe, expect, it } from "vitest";
import { MANAGER_TABS } from "@/domain/catalog";
import { NAV_DEFS, navForTabs } from "@/lib/nav";
import {
  isTone,
  TONE_FG,
  TONE_FILL,
  TONE_GLYPH,
  TONE_GRADIENT,
  TONE_LIQUID,
  TONE_SOFT,
  TONE_SOLID,
  TONE_TINT,
  TONE_WELL,
  TONES,
} from "./tones";

describe("iOS tone tokens", () => {
  it("every tone has fill, liquid, foreground and well classes", () => {
    for (const tone of TONES) {
      expect(TONE_FILL[tone]).toMatch(/bg-gradient/);
      expect(TONE_LIQUID[tone]).toMatch(/bg-gradient/);
      expect(TONE_FG[tone]).toMatch(/^text-/);
      expect(TONE_WELL[tone]).toMatch(/^bg-/);
      expect(TONE_GLYPH[tone]).toMatch(/^from-/);
      expect(TONE_SOFT[tone]).toMatch(/^bg-/);
      expect(TONE_SOLID[tone]).toMatch(/^bg-/);
      expect(TONE_TINT[tone]).toMatch(/^from-/);
      expect(TONE_GRADIENT[tone]).toMatch(/bg-gradient/);
      expect(isTone(tone)).toBe(true);
    }
  });

  it("rejects unknown tone ids", () => {
    expect(isTone("magenta")).toBe(false);
    expect(isTone("")).toBe(false);
  });
});

describe("manager nav tones", () => {
  it("covers every catalog tab with a known tone and icon", () => {
    const ids = NAV_DEFS.map((def) => def.id);
    expect(new Set(ids).size).toBe(NAV_DEFS.length);
    for (const tab of MANAGER_TABS) {
      const def = NAV_DEFS.find((item) => item.id === tab);
      expect(def, tab).toBeTruthy();
      expect(isTone(def!.tone), tab).toBe(true);
      expect(def!.icon).toBeTruthy();
    }
  });

  it("navForTabs keeps catalog order and drops unknown ids", () => {
    const tabs = navForTabs(["dashboard", "today", "ops", "feedback"]);
    expect(tabs.map((item) => item.id)).toEqual(["today", "ops", "dashboard", "feedback"]);
    expect(navForTabs(["today", "not-a-tab" as never])).toHaveLength(1);
  });
});
