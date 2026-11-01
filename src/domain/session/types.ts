import type { WorkspaceKind } from "../catalog/kinds";
import type { ManagerTab } from "../catalog/tabs";
import type { StaffScope, Surface } from "../staff-scope/scope";

export interface UserPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface MembershipPayload {
  id: string;
  role: string;
  staffDepartment: string;
  employeeNumber?: string;
}

export interface WorkspacePayload {
  id: string;
  name: string;
  kind: WorkspaceKind;
  slug: string;
}

export interface SessionPayload {
  user: UserPayload;
  membership: MembershipPayload;
  workspace: WorkspacePayload;
  scope: StaffScope;
  scopeLabel: string;
  tabs: ManagerTab[];
  defaultTab: ManagerTab | "";
  surface: Surface;
}

export interface WorkspaceOption {
  id: string;
  name: string;
  kind: string;
  slug: string;
}

export interface LoginResult {
  token?: string;
  expiresIn?: number;
  workspaces?: WorkspaceOption[];
  needsWorkspacePick: boolean;
  session?: SessionPayload;
}

export function displayName(user: UserPayload): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.email || "Staff";
}

/** Two-letter monogram for an iOS-style avatar. */
export function personInitials(firstName: string, lastName: string, fallback = "?"): string {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  const out = `${a}${b}`.toUpperCase();
  return out.trim() ? out : fallback;
}
