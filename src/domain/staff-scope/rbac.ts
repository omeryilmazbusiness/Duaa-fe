import type { StaffScope } from "./scope";

export const PERMISSIONS = [
  "dashboard.view",
  "workspace.admin",
  "staff.manage",
  "task.view",
  "task.assign",
  "review.view",
  "review.manage",
  "report.submit",
  "finance.view",
  "cash.close",
  "approval.submit",
  "approval.act",
  "ai.use",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALLOWED: Record<Permission, readonly StaffScope[]> = {
  "dashboard.view": ["general_manager", "department_manager", "floor_ops"],
  "workspace.admin": ["general_manager"],
  "staff.manage": ["general_manager", "department_manager"],
  "task.view": ["general_manager", "department_manager"],
  "task.assign": ["general_manager", "department_manager"],
  "review.view": ["general_manager", "floor_ops"],
  "review.manage": ["general_manager", "floor_ops"],
  "report.submit": ["general_manager", "department_manager", "floor_ops", "staff_personnel"],
  "finance.view": ["general_manager"],
  "cash.close": ["general_manager"],
  "approval.submit": ["general_manager", "department_manager"],
  "approval.act": ["general_manager"],
  "ai.use": ["general_manager", "department_manager"],
};

export function allows(scope: StaffScope, permission: Permission): boolean {
  return ALLOWED[permission].includes(scope);
}
