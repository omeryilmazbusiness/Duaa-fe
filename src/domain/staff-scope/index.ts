export type { StaffActor, StaffScope, Surface } from "./scope";
export {
  STAFF_SCOPES,
  resolveStaffScope,
  visibleTabs,
  defaultTab,
  canAccessTab,
  isAnyManager,
  postLoginSurface,
  departmentScope,
  canManageStaffMember,
  isEmployeePortalDepartment,
  scopeLabel,
} from "./scope";
export type { Permission } from "./rbac";
export { PERMISSIONS, allows } from "./rbac";
export {
  postLoginPath,
  loginPath,
  staffLoginPath,
  resolveActiveTab,
  managerGuard,
} from "./routing";
