import type {
  AssistantModelOption,
  AssistantSaveInput,
  AssistantSettings,
  AssistantStatus,
  ChatReply,
  ChatRole,
} from "@/domain/assistant/types";
import type { DashboardView } from "@/domain/dashboard/types";
import type { ActCommand, BriefView, DecisionView } from "@/domain/executive";
import type { ApprovalAction, CashCloseView, SpendApproval } from "@/domain/finance/types";
import type { ReportAction, ReportKind, ReportView } from "@/domain/report/types";
import type { LoginResult, SessionPayload } from "@/domain/session/types";
import type { MemberView, RoutineView, TaskView } from "@/domain/work/types";

/** Token persistence. Presentation depends on this port, not localStorage. */
export interface TokenStore {
  get(): string | null;
  set(token: string, expiresInSec?: number): void;
  clear(): void;
}

export interface AuthPort {
  loginEmail(email: string, password: string): Promise<LoginResult>;
  selectWorkspace(email: string, password: string, workspaceId: string): Promise<LoginResult>;
  loginEmployee(workspaceSlug: string, employeeNumber: string): Promise<LoginResult>;
  me(): Promise<SessionPayload>;
}

export interface StaffPort {
  listPersonnel(workspaceId: string): Promise<MemberView[]>;
  createPersonnel(
    workspaceId: string,
    input: {
      firstName: string;
      lastName: string;
      staffDepartment: string;
      employeeNumber?: string;
      email?: string;
      password?: string;
    },
  ): Promise<MemberView>;
  deactivate(workspaceId: string, membershipId: string): Promise<void>;
  listDepartmentManagers(workspaceId: string): Promise<MemberView[]>;
  createDepartmentManager(
    workspaceId: string,
    input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      staffDepartment: string;
    },
  ): Promise<MemberView>;
}

export interface WorkPort {
  listTasks(workspaceId: string): Promise<TaskView[]>;
  createTask(
    workspaceId: string,
    input: {
      title: string;
      description: string;
      assigneeUserId: string;
      scheduledStartAt: string;
      scheduledEndAt: string;
    },
  ): Promise<TaskView>;
  listRoutines(workspaceId: string): Promise<RoutineView[]>;
  createRoutine(
    workspaceId: string,
    input: {
      title: string;
      description: string;
      assigneeUserId: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<RoutineView>;
  completeTask(workspaceId: string, taskId: string): Promise<TaskView>;
  portalTasks(workspaceId: string): Promise<TaskView[]>;
  completePortalTask(workspaceId: string, taskId: string): Promise<TaskView>;
}

export interface BriefPort {
  getBrief(workspaceId: string): Promise<BriefView>;
  actOnBrief(workspaceId: string, command: ActCommand): Promise<DecisionView>;
}

export interface ReportPort {
  listReports(workspaceId: string): Promise<ReportView[]>;
  submitReport(
    workspaceId: string,
    input: { kind: ReportKind; title: string; detail: string },
  ): Promise<ReportView>;
  actOnReport(
    workspaceId: string,
    reportId: string,
    input: { action: ReportAction; assigneeUserId?: string; title?: string },
  ): Promise<ReportView>;
}

export interface DashboardPort {
  getDashboard(workspaceId: string): Promise<DashboardView>;
}

export interface FinancePort {
  closeCash(
    workspaceId: string,
    input: { countedAmount: number; expectedAmount?: number; note?: string },
  ): Promise<CashCloseView>;
  submitApproval(
    workspaceId: string,
    input: { title: string; supplier: string; amount: number; evidence?: string },
  ): Promise<SpendApproval>;
  actOnApproval(
    workspaceId: string,
    approvalId: string,
    input: { action?: ApprovalAction; amount?: number },
  ): Promise<SpendApproval>;
}

export interface AssistantPort {
  getAssistantStatus(workspaceId: string): Promise<AssistantStatus>;
  getAssistantSettings(workspaceId: string): Promise<AssistantSettings>;
  listAssistantModels(workspaceId: string): Promise<AssistantModelOption[]>;
  saveAssistantSettings(workspaceId: string, input: AssistantSaveInput): Promise<AssistantSettings>;
  removeAssistant(workspaceId: string): Promise<void>;
  chatWithAssistant(
    workspaceId: string,
    input: { messages: { role: ChatRole; content: string }[]; locale: string },
  ): Promise<ChatReply>;
}

export interface KernelApi
  extends AuthPort,
    StaffPort,
    WorkPort,
    BriefPort,
    ReportPort,
    DashboardPort,
    FinancePort,
    AssistantPort {}
