import type { WorkspaceKind } from "./kinds";
import type { ManagerTab } from "./tabs";

/**
 * Catalog is the Open/Closed extension point for a vertical.
 * Cafe is the first implementation; hotel/supply register the same contract.
 */
export interface VerticalCatalog {
  readonly kind: WorkspaceKind;
  departments(): readonly string[];
  departmentManagerDepartments(): readonly string[];
  employeeNumberDepartments(): readonly string[];
  emailLoginDepartments(): readonly string[];
  /** Reception analog (email login + limited ops surface). */
  floorOpsDepartment(): string;
  gmTabs(): readonly ManagerTab[];
  departmentManagerTabs(): readonly ManagerTab[];
  floorOpsTabs(): readonly ManagerTab[];
  /** Morning-OS inputs. Unwired kinds render as honest missing sources, never fake cards. */
  executiveSignals(): readonly string[];
  /** GM pulse tiles. Missing adapters stay unavailable, never a fake zero. */
  dashboardModules(): readonly string[];
}
