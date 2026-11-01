import type { VerticalCatalog } from "./catalog";
import { CAFE_DEPARTMENTS } from "./departments";
import type { ManagerTab } from "./tabs";

const GM_TABS: readonly ManagerTab[] = ["dashboard", "today", "ops", "feedback"];
const DEPT_TABS: readonly ManagerTab[] = [
  "overview",
  "tasks_staff",
  "tasks_detail",
  "routines",
  "team",
];
const FLOOR_TABS: readonly ManagerTab[] = ["requests", "feedback"];

/** Cafe vertical — Guest-pro hotel depts mapped onto cafe ops. No rooms/reservations. */
export const cafeCatalog: VerticalCatalog = {
  kind: "cafe",
  departments: () => CAFE_DEPARTMENTS,
  departmentManagerDepartments: () => CAFE_DEPARTMENTS,
  employeeNumberDepartments: () => ["KITCHEN", "BAR", "CLEANING", "MAINTENANCE", "FINANCIAL_ACCOUNTING"],
  emailLoginDepartments: () => ["SERVICE"],
  floorOpsDepartment: () => "SERVICE",
  gmTabs: () => GM_TABS,
  departmentManagerTabs: () => DEPT_TABS,
  floorOpsTabs: () => FLOOR_TABS,
  executiveSignals: () => ["handover", "late_staff", "customer_voice", "breakdown", "daily_close", "checklist", "cash_variance"],
  dashboardModules: () => ["pulse", "reports", "cash", "approvals", "sales", "waste"],
};
