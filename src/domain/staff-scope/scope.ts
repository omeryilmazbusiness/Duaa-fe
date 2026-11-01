import type { VerticalCatalog } from "../catalog/catalog";
import { containsDept } from "../catalog/departments";
import type { ManagerTab } from "../catalog/tabs";

export const STAFF_SCOPES = [
  "general_manager",
  "department_manager",
  "floor_ops",
  "staff_personnel",
] as const;

export type StaffScope = (typeof STAFF_SCOPES)[number];

export type Surface = "manager" | "staff_portal";

export interface StaffActor {
  role: string;
  department: string;
}

export function resolveStaffScope(actor: StaffActor, catalog: VerticalCatalog): StaffScope {
  if (actor.role === "manager") {
    if (actor.department && containsDept(catalog.departmentManagerDepartments(), actor.department)) {
      return "department_manager";
    }
    return "general_manager";
  }
  if (actor.role === "personnel") {
    if (actor.department && actor.department === catalog.floorOpsDepartment()) {
      return "floor_ops";
    }
    return "staff_personnel";
  }
  return "staff_personnel";
}

export function visibleTabs(scope: StaffScope, catalog: VerticalCatalog): readonly ManagerTab[] {
  switch (scope) {
    case "general_manager":
      return catalog.gmTabs();
    case "department_manager":
      return catalog.departmentManagerTabs();
    case "floor_ops":
      return catalog.floorOpsTabs();
    default:
      return [];
  }
}

export function defaultTab(scope: StaffScope, catalog: VerticalCatalog): ManagerTab | "" {
  const tabs = visibleTabs(scope, catalog);
  return tabs[0] ?? "";
}

export function canAccessTab(scope: StaffScope, catalog: VerticalCatalog, tab: ManagerTab): boolean {
  return visibleTabs(scope, catalog).includes(tab);
}

export function isAnyManager(scope: StaffScope): boolean {
  return scope === "general_manager" || scope === "department_manager";
}

export function postLoginSurface(scope: StaffScope): Surface {
  return scope === "staff_personnel" ? "staff_portal" : "manager";
}

export function departmentScope(actor: StaffActor, catalog: VerticalCatalog): string {
  return resolveStaffScope(actor, catalog) === "department_manager" ? actor.department : "";
}

export function canManageStaffMember(
  actor: StaffActor,
  member: StaffActor,
  catalog: VerticalCatalog,
): boolean {
  const scope = resolveStaffScope(actor, catalog);
  if (member.role !== "personnel") return false;
  if (scope === "general_manager") return true;
  if (scope === "department_manager") return member.department === actor.department;
  return false;
}

export function isEmployeePortalDepartment(department: string, catalog: VerticalCatalog): boolean {
  return containsDept(catalog.employeeNumberDepartments(), department);
}

export function scopeLabel(scope: StaffScope, department?: string): string {
  switch (scope) {
    case "general_manager":
      return "General Manager";
    case "department_manager":
      return department ? `${department} Manager` : "Department Manager";
    case "floor_ops":
      return "Floor";
    default:
      return department || "Staff";
  }
}
