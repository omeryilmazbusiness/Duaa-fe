import type { VerticalCatalog } from "./catalog";
import { SUPPLY_DEPARTMENTS } from "./departments";
import type { ManagerTab } from "./tabs";

const GM_TABS: readonly ManagerTab[] = ["today", "ops", "dashboard"];
const DEPT_TABS: readonly ManagerTab[] = [
  "overview",
  "tasks_staff",
  "tasks_detail",
  "routines",
  "team",
];
const FLOOR_TABS: readonly ManagerTab[] = ["requests"];

/** Supply / Ana Akhdar — reserved vertical. */
export const supplyCatalog: VerticalCatalog = {
  kind: "supply",
  departments: () => SUPPLY_DEPARTMENTS,
  departmentManagerDepartments: () => SUPPLY_DEPARTMENTS,
  employeeNumberDepartments: () => ["WAREHOUSE", "DELIVERY", "FINANCIAL_ACCOUNTING"],
  emailLoginDepartments: () => ["SALES"],
  floorOpsDepartment: () => "SALES",
  gmTabs: () => GM_TABS,
  departmentManagerTabs: () => DEPT_TABS,
  floorOpsTabs: () => FLOOR_TABS,
  executiveSignals: () => ["late_staff"],
  dashboardModules: () => ["pulse", "approvals"],
};
