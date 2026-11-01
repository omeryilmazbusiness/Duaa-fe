import type { KernelApi, TokenStore } from "@/application/ports";
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
import { createHttpClient, type HttpClient } from "./client";
import {
  mapApproval,
  mapAssistantModels,
  mapAssistantSettings,
  mapAssistantStatus,
  mapChatReply,
  mapBrief,
  mapCashClose,
  mapDashboard,
  mapDecision,
  mapList,
  mapLogin,
  mapMember,
  mapReport,
  mapRoutine,
  mapSession,
  mapTask,
} from "./mappers";

export class HttpKernelApi implements KernelApi {
  private readonly http: HttpClient;

  constructor(tokens: TokenStore) {
    this.http = createHttpClient(tokens);
  }

  loginEmail(email: string, password: string): Promise<LoginResult> {
    return this.http
      .request("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
      .then(mapLogin);
  }

  selectWorkspace(email: string, password: string, workspaceId: string): Promise<LoginResult> {
    return this.http
      .request("/v1/auth/login/select", {
        method: "POST",
        body: JSON.stringify({ email, password, workspaceId }),
      })
      .then(mapLogin);
  }

  loginEmployee(workspaceSlug: string, employeeNumber: string): Promise<LoginResult> {
    return this.http
      .request("/v1/auth/staff-login", {
        method: "POST",
        body: JSON.stringify({ workspaceSlug, employeeNumber }),
      })
      .then(mapLogin);
  }

  me(): Promise<SessionPayload> {
    return this.http.request("/v1/me").then(mapSession);
  }

  listPersonnel(workspaceId: string): Promise<MemberView[]> {
    return this.http.request(`/v1/workspaces/${workspaceId}/staff`).then((r) => mapList(r, mapMember));
  }

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
  ): Promise<MemberView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/staff`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapMember);
  }

  async deactivate(workspaceId: string, membershipId: string): Promise<void> {
    await this.http.request(`/v1/workspaces/${workspaceId}/staff/${membershipId}`, {
      method: "DELETE",
    });
  }

  listDepartmentManagers(workspaceId: string): Promise<MemberView[]> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/staff/department-managers`)
      .then((r) => mapList(r, mapMember));
  }

  createDepartmentManager(
    workspaceId: string,
    input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      staffDepartment: string;
    },
  ): Promise<MemberView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/staff/department-managers`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapMember);
  }

  listTasks(workspaceId: string): Promise<TaskView[]> {
    return this.http.request(`/v1/workspaces/${workspaceId}/tasks`).then((r) => mapList(r, mapTask));
  }

  createTask(
    workspaceId: string,
    input: {
      title: string;
      description: string;
      assigneeUserId: string;
      scheduledStartAt: string;
      scheduledEndAt: string;
    },
  ): Promise<TaskView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapTask);
  }

  listRoutines(workspaceId: string): Promise<RoutineView[]> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/routines`)
      .then((r) => mapList(r, mapRoutine));
  }

  createRoutine(
    workspaceId: string,
    input: {
      title: string;
      description: string;
      assigneeUserId: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<RoutineView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/routines`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapRoutine);
  }

  completeTask(workspaceId: string, taskId: string): Promise<TaskView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/tasks/${taskId}/complete`, {
        method: "PATCH",
      })
      .then(mapTask);
  }

  portalTasks(workspaceId: string): Promise<TaskView[]> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/staff-portal/tasks`)
      .then((r) => mapList(r, mapTask));
  }

  completePortalTask(workspaceId: string, taskId: string): Promise<TaskView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/staff-portal/tasks/${taskId}/complete`, {
        method: "PATCH",
      })
      .then(mapTask);
  }

  getBrief(workspaceId: string): Promise<BriefView> {
    return this.http.request(`/v1/workspaces/${workspaceId}/executive/brief`).then(mapBrief);
  }

  actOnBrief(workspaceId: string, command: ActCommand): Promise<DecisionView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/executive/act`, {
        method: "POST",
        body: JSON.stringify(command),
      })
      .then(mapDecision);
  }

  listReports(workspaceId: string): Promise<ReportView[]> {
    return this.http.request(`/v1/workspaces/${workspaceId}/reports`).then((r) => mapList(r, mapReport));
  }

  submitReport(
    workspaceId: string,
    input: { kind: ReportKind; title: string; detail: string },
  ): Promise<ReportView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/reports`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapReport);
  }

  actOnReport(
    workspaceId: string,
    reportId: string,
    input: { action: ReportAction; assigneeUserId?: string; title?: string },
  ): Promise<ReportView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/reports/${reportId}/act`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapReport);
  }

  getDashboard(workspaceId: string): Promise<DashboardView> {
    return this.http.request(`/v1/workspaces/${workspaceId}/executive/dashboard`).then(mapDashboard);
  }

  closeCash(
    workspaceId: string,
    input: { countedAmount: number; expectedAmount?: number; note?: string },
  ): Promise<CashCloseView> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cash/close`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapCashClose);
  }

  submitApproval(
    workspaceId: string,
    input: { title: string; supplier: string; amount: number; evidence?: string },
  ): Promise<SpendApproval> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/approvals`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapApproval);
  }

  actOnApproval(
    workspaceId: string,
    approvalId: string,
    input: { action?: ApprovalAction; amount?: number },
  ): Promise<SpendApproval> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/approvals/${approvalId}/act`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapApproval);
  }

  getAssistantStatus(workspaceId: string): Promise<AssistantStatus> {
    return this.http.request(`/v1/workspaces/${workspaceId}/assistant/status`).then(mapAssistantStatus);
  }

  getAssistantSettings(workspaceId: string): Promise<AssistantSettings> {
    return this.http.request(`/v1/workspaces/${workspaceId}/assistant/settings`).then(mapAssistantSettings);
  }

  listAssistantModels(workspaceId: string): Promise<AssistantModelOption[]> {
    return this.http.request(`/v1/workspaces/${workspaceId}/assistant/models`).then(mapAssistantModels);
  }

  saveAssistantSettings(workspaceId: string, input: AssistantSaveInput): Promise<AssistantSettings> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/assistant/settings`, {
        method: "PUT",
        body: JSON.stringify(input),
      })
      .then(mapAssistantSettings);
  }

  async removeAssistant(workspaceId: string): Promise<void> {
    await this.http.request(`/v1/workspaces/${workspaceId}/assistant/settings`, { method: "DELETE" });
  }

  chatWithAssistant(
    workspaceId: string,
    input: { messages: { role: ChatRole; content: string }[]; locale: string },
  ): Promise<ChatReply> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/assistant/chat`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapChatReply);
  }
}
