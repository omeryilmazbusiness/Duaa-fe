import type { VerticalCatalog } from "./catalog";
import { HOTEL_DEPARTMENTS } from "./departments";
import type { ManagerTab } from "./tabs";

const GM_TABS: readonly ManagerTab[] = ["today", "ops", "dashboard", "reservations", "feedback"];
const DEPT_TABS: readonly ManagerTab[] = [
  "overview",
  "tasks_staff",
  "tasks_detail",
  "routines",
  "team",
];
const FLOOR_TABS: readonly ManagerTab[] = ["guests", "live_chat", "requests"];

/** Hotel vertical — registered so a later workspace does not fork the shell. */
export const hotelCatalog: VerticalCatalog = {
  kind: "hotel",
  departments: () => HOTEL_DEPARTMENTS,
  departmentManagerDepartments: () => [
    "HOUSEKEEPING",
    "BELLMAN",
    "RECEPTION",
    "KITCHEN",
    "FINANCIAL_ACCOUNTING",
    "SECURITY",
    "MAINTENANCE",
    "MARKETING",
    "SPA_GYM",
  ],
  employeeNumberDepartments: () => [
    "HOUSEKEEPING",
    "BELLMAN",
    "KITCHEN",
    "FINANCIAL_ACCOUNTING",
    "SECURITY",
    "MAINTENANCE",
    "MARKETING",
    "SPA_GYM",
  ],
  emailLoginDepartments: () => ["RECEPTION", "RESTAURANT"],
  floorOpsDepartment: () => "RECEPTION",
  gmTabs: () => GM_TABS,
  departmentManagerTabs: () => DEPT_TABS,
  floorOpsTabs: () => FLOOR_TABS,
  executiveSignals: () => ["late_staff", "customer_voice", "reservations"],
  dashboardModules: () => ["pulse", "occupancy", "approvals"],
};
