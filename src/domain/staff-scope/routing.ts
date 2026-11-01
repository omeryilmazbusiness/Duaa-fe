import type { ManagerTab } from "../catalog/tabs";
import type { StaffScope, Surface } from "./scope";

export function postLoginPath(input: {
  slug: string;
  surface: Surface;
  defaultTab?: string;
}): string {
  if (input.surface === "staff_portal") {
    return `/${input.slug}/staff`;
  }
  const tab = input.defaultTab ? `?tab=${encodeURIComponent(input.defaultTab)}` : "";
  return `/${input.slug}/manager${tab}`;
}

export function loginPath(slug?: string): string {
  return slug ? `/${slug}/login` : "/login";
}

export function staffLoginPath(slug: string): string {
  return `/${slug}/staff-login`;
}

export function resolveActiveTab(
  requested: string | null,
  tabs: readonly ManagerTab[],
  fallback: ManagerTab | "",
): ManagerTab | "" {
  if (requested && tabs.includes(requested as ManagerTab)) {
    return requested as ManagerTab;
  }
  return fallback || tabs[0] || "";
}

export function managerGuard(scope: StaffScope): "manager" | "staff" | "login" {
  if (scope === "staff_personnel") return "staff";
  if (
    scope === "general_manager" ||
    scope === "department_manager" ||
    scope === "floor_ops"
  ) {
    return "manager";
  }
  return "login";
}
