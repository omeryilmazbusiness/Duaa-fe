import type { KernelApi, TokenStore } from "@/application/ports";
import type {
  AssistantModelOption,
  AssistantSaveInput,
  AssistantSettings,
  AssistantStatus,
  ChatReply,
  ChatRole,
} from "@/domain/assistant/types";
import type { CafeDefinition, CafeDefinitionSave } from "@/domain/cafe/definition";
import type { CafeCheckDraft, CafeChecklist } from "@/domain/cafe/checklist";
import type { POSDay, POSTicketDraft } from "@/domain/cafe/pos";
import type { PrepDay, PrepTicketDraft } from "@/domain/cafe/prep";
import type { RecipeDraft, WasteDay, WasteTicketDraft } from "@/domain/cafe/waste";
import type { CafeHandover, CafeHandoverOpen } from "@/domain/cafe/handover";
import type { CafeIntake, CafeIntakeSave } from "@/domain/cafe/intake";
import type { CafeQRCode, CafeVoice, PublicQR, PublicQRSubmit, RecoveryAction } from "@/domain/cafe/qr";
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
  mapCafeDefinition,
  mapCafeChecklist,
  mapPOSDay,
  mapPrepDay,
  mapWasteDay,
  mapCafeHandover,
  mapCafeIntake,
  mapCafeQRCode,
  mapCafeVoice,
  mapPublicQR,
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

  attachApprovalEvidence(workspaceId: string, approvalId: string, evidence: string): Promise<SpendApproval> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/approvals/${approvalId}/evidence`, {
        method: "POST",
        body: JSON.stringify({ evidence }),
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
    // Cap wait so a slow provider never parks the GM; UI maps timeout to the warming copy.
    return this.http
      .request(`/v1/workspaces/${workspaceId}/assistant/chat`, {
        method: "POST",
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(10_000),
      })
      .then(mapChatReply);
  }

  getCafeDefinition(workspaceId: string): Promise<CafeDefinition> {
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/definition`).then(mapCafeDefinition);
  }

  saveCafeDefinition(workspaceId: string, input: CafeDefinitionSave): Promise<CafeDefinition> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/definition`, {
        method: "PUT",
        body: JSON.stringify(input),
      })
      .then(mapCafeDefinition);
  }

  listCafeQR(workspaceId: string): Promise<CafeQRCode[]> {
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/qr`).then((r) => mapList(r, mapCafeQRCode));
  }

  issueCafeTable(workspaceId: string, tableNumber: string): Promise<CafeQRCode> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/qr/tables`, {
        method: "POST",
        body: JSON.stringify({ tableNumber }),
      })
      .then(mapCafeQRCode);
  }

  renameCafeTable(workspaceId: string, siteId: string, tableNumber: string): Promise<CafeQRCode> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/qr/${siteId}`, {
        method: "PATCH",
        body: JSON.stringify({ tableNumber }),
      })
      .then(mapCafeQRCode);
  }

  rotateCafeQR(workspaceId: string, siteId: string): Promise<CafeQRCode> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/qr/${siteId}/rotate`, { method: "POST", body: "{}" })
      .then(mapCafeQRCode);
  }

  listCafeVoices(workspaceId: string): Promise<CafeVoice[]> {
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/voices`).then((r) => mapList(r, mapCafeVoice));
  }

  actOnCafeVoice(
    workspaceId: string,
    voiceId: string,
    input: { action: RecoveryAction; assigneeUserId?: string; note?: string; amount?: number },
  ): Promise<CafeVoice> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/voices/${voiceId}/act`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapCafeVoice);
  }

  resolvePublicQR(token: string): Promise<PublicQR> {
    return this.http.request(`/v1/public/qr/${token}`).then(mapPublicQR);
  }

  submitPublicQR(token: string, input: PublicQRSubmit): Promise<CafeVoice> {
    return this.http
      .request(`/v1/public/qr/${token}`, { method: "POST", body: JSON.stringify(input) })
      .then(mapCafeVoice);
  }

  getCafeIntake(workspaceId: string, date?: string): Promise<CafeIntake> {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/intake${q}`).then(mapCafeIntake);
  }

  saveCafeIntake(workspaceId: string, input: CafeIntakeSave): Promise<CafeIntake> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/intake`, {
        method: "PUT",
        body: JSON.stringify(input),
      })
      .then(mapCafeIntake);
  }

  getCafeHandover(workspaceId: string): Promise<CafeHandover> {
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/handover`).then(mapCafeHandover);
  }

  openCafeHandover(workspaceId: string, input: CafeHandoverOpen): Promise<CafeHandover> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/handover`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapCafeHandover);
  }

  acceptCafeHandover(workspaceId: string, handoverId: string): Promise<CafeHandover> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/handover/${handoverId}/accept`, {
        method: "POST",
        body: "{}",
      })
      .then(mapCafeHandover);
  }

  getCafeChecklist(workspaceId: string, date?: string): Promise<CafeChecklist> {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/checklist${q}`).then(mapCafeChecklist);
  }

  saveCafeChecklist(workspaceId: string, items: CafeCheckDraft[]): Promise<CafeChecklist> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/checklist`, {
        method: "PUT",
        body: JSON.stringify({ items }),
      })
      .then(mapCafeChecklist);
  }

  toggleCafeChecklist(workspaceId: string, input: { businessDate?: string; itemId: string }): Promise<CafeChecklist> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/checklist/toggle`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapCafeChecklist);
  }

  getCafePOS(workspaceId: string, date?: string): Promise<POSDay> {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/pos${q}`).then(mapPOSDay);
  }

  recordCafePOS(workspaceId: string, input: POSTicketDraft): Promise<POSDay> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/pos/tickets`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapPOSDay);
  }

  closeCafePOS(workspaceId: string, businessDate?: string): Promise<POSDay> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/pos/close`, {
        method: "POST",
        body: JSON.stringify({ businessDate }),
      })
      .then(mapPOSDay);
  }

  getCafePrep(workspaceId: string, date?: string): Promise<PrepDay> {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/prep${q}`).then(mapPrepDay);
  }

  recordCafePrep(workspaceId: string, input: PrepTicketDraft): Promise<PrepDay> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/prep/tickets`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapPrepDay);
  }

  readyCafePrep(workspaceId: string, ticketId: string): Promise<PrepDay> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/prep/${ticketId}/ready`, { method: "POST" })
      .then(mapPrepDay);
  }

  serveCafePrep(workspaceId: string, ticketId: string): Promise<PrepDay> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/prep/${ticketId}/serve`, { method: "POST" })
      .then(mapPrepDay);
  }

  getCafeWaste(workspaceId: string, date?: string): Promise<WasteDay> {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.http.request(`/v1/workspaces/${workspaceId}/cafe/waste${q}`).then(mapWasteDay);
  }

  recordCafeWaste(workspaceId: string, input: WasteTicketDraft): Promise<WasteDay> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/waste/tickets`, {
        method: "POST",
        body: JSON.stringify(input),
      })
      .then(mapWasteDay);
  }

  saveCafeRecipes(workspaceId: string, recipes: RecipeDraft[]): Promise<WasteDay> {
    return this.http
      .request(`/v1/workspaces/${workspaceId}/cafe/waste/recipes`, {
        method: "PUT",
        body: JSON.stringify({ recipes }),
      })
      .then(mapWasteDay);
  }
}
