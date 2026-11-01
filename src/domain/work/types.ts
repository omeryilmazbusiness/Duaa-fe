export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "blocked";

export interface TaskView {
  id: string;
  title: string;
  description: string;
  assigneeUserId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: TaskStatus;
  isOverdue: boolean;
  completedAt: string | null;
}

export interface RoutineView {
  id: string;
  title: string;
  description: string;
  assigneeUserId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface MemberView {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  staffDepartment: string;
  employeeNumber?: string;
  isActive: boolean;
}

export function memberDisplayName(m: MemberView): string {
  return `${m.firstName} ${m.lastName}`.trim() || m.employeeNumber || m.email || "Staff";
}

export function memberInitials(m: MemberView): string {
  const a = m.firstName.trim().charAt(0);
  const b = m.lastName.trim().charAt(0);
  const initials = `${a}${b}`.toUpperCase();
  return initials || (m.employeeNumber ?? "?").slice(0, 2).toUpperCase();
}

export function isOpenTask(task: TaskView): boolean {
  return task.status !== "completed" && task.status !== "cancelled";
}
