import { describe, expect, it } from "vitest";
import { cafeCatalog } from "@/domain/catalog/cafe";
import { hotelCatalog } from "@/domain/catalog/hotel";
import { allows } from "./rbac";
import { postLoginPath, resolveActiveTab } from "./routing";
import {
  canManageStaffMember,
  defaultTab,
  postLoginSurface,
  resolveStaffScope,
  visibleTabs,
} from "./scope";

describe("staff scope", () => {
  it("resolves cafe GM / kitchen müdür / SERVICE floor / barista", () => {
    expect(resolveStaffScope({ role: "manager", department: "" }, cafeCatalog)).toBe("general_manager");
    expect(resolveStaffScope({ role: "manager", department: "KITCHEN" }, cafeCatalog)).toBe(
      "department_manager",
    );
    expect(resolveStaffScope({ role: "personnel", department: "SERVICE" }, cafeCatalog)).toBe("floor_ops");
    expect(resolveStaffScope({ role: "personnel", department: "BAR" }, cafeCatalog)).toBe("staff_personnel");
  });

  it("kitchen müdür cannot manage bar personnel", () => {
    const kitchenMgr = { role: "manager", department: "KITCHEN" };
    expect(
      canManageStaffMember(kitchenMgr, { role: "personnel", department: "KITCHEN" }, cafeCatalog),
    ).toBe(true);
    expect(
      canManageStaffMember(kitchenMgr, { role: "personnel", department: "BAR" }, cafeCatalog),
    ).toBe(false);
  });

  it("cafe GM tabs come from catalog, not a hotel hardcoded list", () => {
    expect(visibleTabs("general_manager", cafeCatalog)).toEqual([
      "dashboard",
      "today",
      "ops",
      "feedback",
    ]);
    expect(defaultTab("general_manager", cafeCatalog)).toBe("dashboard");
    expect(visibleTabs("general_manager", hotelCatalog)).toContain("reservations");
  });

  it("staff portal is the post-login surface for personnel", () => {
    expect(postLoginSurface("staff_personnel")).toBe("staff_portal");
    expect(postLoginSurface("general_manager")).toBe("manager");
    expect(
      postLoginPath({ slug: "duaa-cafe", surface: "manager", defaultTab: "today" }),
    ).toBe("/duaa-cafe/manager?tab=today");
    expect(postLoginPath({ slug: "duaa-cafe", surface: "staff_portal" })).toBe("/duaa-cafe/staff");
  });

  it("snaps invalid deep links to the catalog default", () => {
    expect(resolveActiveTab("reservations", ["dashboard", "today", "ops", "feedback"], "dashboard")).toBe(
      "dashboard",
    );
    expect(resolveActiveTab("ops", ["today", "ops", "dashboard", "feedback"], "today")).toBe("ops");
  });

  it("mirrors Duaa CORE ENTITLEMENTS", () => {
    expect(allows("general_manager", "workspace.admin")).toBe(true);
    expect(allows("department_manager", "workspace.admin")).toBe(false);
    expect(allows("floor_ops", "review.view")).toBe(true);
    expect(allows("staff_personnel", "task.assign")).toBe(false);
    expect(allows("general_manager", "cash.close")).toBe(true);
    expect(allows("department_manager", "cash.close")).toBe(false);
    expect(allows("department_manager", "approval.submit")).toBe(true);
    expect(allows("staff_personnel", "finance.view")).toBe(false);
  });
});
