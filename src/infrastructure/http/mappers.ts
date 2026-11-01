import { isWorkspaceKind } from "@/domain/catalog/kinds";
import { parseManagerTabs } from "@/domain/catalog/tabs";
import type {
  AssistantModelOption,
  AssistantProviderId,
  AssistantProviderOption,
  AssistantSettings,
  AssistantStatus,
  AssistantUsage,
  ChatReply,
} from "@/domain/assistant/types";
import type {
  DashboardApproval,
  DashboardCash,
  DashboardPulse,
  DashboardTile,
  DashboardView,
  TileStatus,
  WorkloadRow,
} from "@/domain/dashboard/types";
import type { LoginResult, SessionPayload, WorkspaceOption } from "@/domain/session/types";
import type { StaffScope, Surface } from "@/domain/staff-scope/scope";
import type {
  BriefCard,
  BriefView,
  DecisionAction,
  DecisionStatus,
  DecisionView,
} from "@/domain/executive";
import type { ApprovalStatus, CashCloseView, SpendApproval } from "@/domain/finance/types";
import type { ReportKind, ReportStatus, ReportView } from "@/domain/report/types";
import type { MemberView, RoutineView, TaskView } from "@/domain/work/types";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function bool(v: unknown): boolean {
  return v === true;
}

const SCOPES = new Set(["general_manager", "department_manager", "floor_ops", "staff_personnel"]);

function asScope(v: unknown): StaffScope {
  return SCOPES.has(str(v)) ? (v as StaffScope) : "staff_personnel";
}

export function mapSession(raw: unknown): SessionPayload {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? {}) as Record<string, unknown>;
  const membership = (r.membership ?? {}) as Record<string, unknown>;
  const workspace = (r.workspace ?? {}) as Record<string, unknown>;
  const kindRaw = str(workspace.kind, "cafe");
  const tabs = Array.isArray(r.tabs) ? r.tabs.map((t) => str(t)) : [];
  const surface: Surface = r.surface === "staff_portal" ? "staff_portal" : "manager";
  return {
    user: {
      id: str(user.id),
      email: str(user.email),
      firstName: str(user.firstName),
      lastName: str(user.lastName),
    },
    membership: {
      id: str(membership.id),
      role: str(membership.role),
      staffDepartment: str(membership.staffDepartment),
      employeeNumber: str(membership.employeeNumber) || undefined,
    },
    workspace: {
      id: str(workspace.id),
      name: str(workspace.name),
      kind: isWorkspaceKind(kindRaw) ? kindRaw : "cafe",
      slug: str(workspace.slug),
    },
    scope: asScope(r.scope),
    scopeLabel: str(r.scopeLabel, "Staff"),
    tabs: parseManagerTabs(tabs),
    defaultTab: parseManagerTabs([str(r.defaultTab)])[0] ?? "",
    surface,
  };
}

export function mapLogin(raw: unknown): LoginResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const workspaces = Array.isArray(r.workspaces)
    ? r.workspaces.map((w): WorkspaceOption => {
        const o = (w ?? {}) as Record<string, unknown>;
        return { id: str(o.id), name: str(o.name), kind: str(o.kind), slug: str(o.slug) };
      })
    : [];
  return {
    token: str(r.token) || undefined,
    expiresIn: num(r.expiresIn) || undefined,
    workspaces,
    needsWorkspacePick: bool(r.needsWorkspacePick),
    session: r.session ? mapSession(r.session) : undefined,
  };
}

export function mapMember(raw: unknown): MemberView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    userId: str(r.userId),
    email: str(r.email),
    firstName: str(r.firstName),
    lastName: str(r.lastName),
    role: str(r.role),
    staffDepartment: str(r.staffDepartment),
    employeeNumber: str(r.employeeNumber) || undefined,
    isActive: r.isActive !== false,
  };
}

export function mapTask(raw: unknown): TaskView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const status = str(r.status, "pending");
  return {
    id: str(r.id),
    title: str(r.title),
    description: str(r.description),
    assigneeUserId: str(r.assigneeUserId),
    scheduledStartAt: str(r.scheduledStartAt),
    scheduledEndAt: str(r.scheduledEndAt),
    status: status as TaskView["status"],
    isOverdue: bool(r.isOverdue),
    completedAt: typeof r.completedAt === "string" ? r.completedAt : null,
  };
}

/** Go encodes work.Routine without json tags — accept PascalCase. */
export function mapRoutine(raw: unknown): RoutineView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id ?? r.ID),
    title: str(r.title ?? r.Title),
    description: str(r.description ?? r.Description),
    assigneeUserId: str(r.assigneeUserId ?? r.AssigneeUserID),
    startTime: str(r.startTime ?? r.StartTime),
    endTime: str(r.endTime ?? r.EndTime),
    isActive: r.isActive !== false && r.IsActive !== false,
  };
}

const ACTIONS = new Set<DecisionAction>(["acknowledge", "assign", "resolve"]);
const STATUSES = new Set<DecisionStatus>(["open", "acknowledged", "assigned", "resolved"]);

function asActions(raw: unknown): DecisionAction[] {
  if (!Array.isArray(raw)) return ["acknowledge", "assign", "resolve"];
  return raw.map((item) => str(item)).filter((item): item is DecisionAction => ACTIONS.has(item as DecisionAction));
}

function asStatus(raw: unknown): DecisionStatus {
  const value = str(raw, "open");
  return STATUSES.has(value as DecisionStatus) ? (value as DecisionStatus) : "open";
}

export function mapBrief(raw: unknown): BriefView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const pulse = (r.pulse ?? {}) as Record<string, unknown>;
  const headline = (r.headline ?? {}) as Record<string, unknown>;
  const cards = Array.isArray(r.cards) ? r.cards : [];
  const sources = Array.isArray(r.sources) ? r.sources : [];
  return {
    generatedAt: str(r.generatedAt),
    date: str(r.date),
    workspaceKind: str(r.workspaceKind ?? r.kind),
    headline: {
      overdueTasks: num(headline.overdueTasks ?? pulse.overdueTasks),
      pendingDecisions: num(headline.pendingDecisions),
      assignedFollowups: num(headline.assignedFollowups),
    },
    pulse: {
      overdueTasks: num(pulse.overdueTasks),
      openTasks: num(pulse.openTasks),
      completedToday: num(pulse.completedToday),
    },
    cards: cards.map(mapCard),
    sources: sources.map((item) => {
      const src = (item ?? {}) as Record<string, unknown>;
      return {
        kind: str(src.kind),
        status: src.status === "live" ? "live" : "unavailable",
        reasonKey: str(src.reasonKey) || undefined,
      };
    }),
    snoozedCount: num(r.snoozedCount),
    isClear: bool(r.isClear),
  };
}

function mapCard(raw: unknown): BriefCard {
  const item = (raw ?? {}) as Record<string, unknown>;
  const decision = item.decision && typeof item.decision === "object" ? (item.decision as Record<string, unknown>) : null;
  return {
    sourceKey: str(item.sourceKey ?? item.id),
    fingerprint: str(item.fingerprint),
    kind: str(item.kind),
    severity: str(item.severity, "low"),
    titleKey: str(item.titleKey),
    detail: str(item.detail) || undefined,
    count: num(item.count),
    priority: num(item.priority),
    targetTab: str(item.targetTab),
    allowedActions: asActions(item.allowedActions),
    decision: decision
      ? {
          id: str(decision.id),
          status: asStatus(decision.status),
          assigneeUserId: str(decision.assigneeUserId) || undefined,
          linkedTaskId: str(decision.linkedTaskId) || undefined,
        }
      : null,
  };
}

export function mapDecision(raw: unknown): DecisionView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    sourceKey: str(r.sourceKey),
    fingerprint: str(r.fingerprint),
    kind: str(r.kind),
    status: asStatus(r.status),
    assigneeUserId: str(r.assigneeUserId) || undefined,
    linkedTaskId: str(r.linkedTaskId) || undefined,
    snoozeUntil: str(r.snoozeUntil) || undefined,
  };
}

export function mapList<T>(raw: unknown, map: (item: unknown) => T): T[] {
  return Array.isArray(raw) ? raw.map(map) : [];
}

const REPORT_KINDS = new Set<ReportKind>(["breakage", "request"]);
const REPORT_STATUSES = new Set<ReportStatus>(["open", "assigned", "resolved"]);

export function mapReport(raw: unknown): ReportView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const kind = str(r.kind, "breakage");
  const status = str(r.status, "open");
  return {
    id: str(r.id),
    kind: REPORT_KINDS.has(kind as ReportKind) ? (kind as ReportKind) : "breakage",
    title: str(r.title),
    detail: str(r.detail),
    status: REPORT_STATUSES.has(status as ReportStatus) ? (status as ReportStatus) : "open",
    reporterUserId: str(r.reporterUserId),
    reporterName: str(r.reporterName),
    reporterDepartment: str(r.reporterDepartment) || undefined,
    assigneeUserId: str(r.assigneeUserId) || undefined,
    linkedTaskId: str(r.linkedTaskId) || undefined,
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

function asTileStatus(raw: unknown): TileStatus {
  return raw === "live" ? "live" : "unavailable";
}

function optInt(raw: unknown): number | undefined {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

export function mapDashboard(raw: unknown): DashboardView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const pulse = (r.pulse ?? {}) as Record<string, unknown>;
  const cashRaw = r.cash && typeof r.cash === "object" ? (r.cash as Record<string, unknown>) : null;
  return {
    generatedAt: str(r.generatedAt),
    date: str(r.date),
    workspaceKind: str(r.workspaceKind ?? r.kind),
    pulse: {
      employees: num(pulse.employees),
      openTasks: num(pulse.openTasks),
      overdueTasks: num(pulse.overdueTasks),
      completedToday: num(pulse.completedToday),
      openReports: num(pulse.openReports),
      overloadedStaff: num(pulse.overloadedStaff),
      pendingApprovals: num(pulse.pendingApprovals),
    } satisfies DashboardPulse,
    tiles: mapList(r.tiles, mapTile),
    cash: cashRaw ? mapCash(cashRaw) : undefined,
    approvals: Array.isArray(r.approvals) ? r.approvals.map(mapDashApproval) : undefined,
    workload: mapList(r.workload, mapWorkload),
  };
}

function mapTile(raw: unknown): DashboardTile {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    module: str(r.module),
    status: asTileStatus(r.status),
    reasonKey: str(r.reasonKey) || undefined,
    value: num(r.value),
    labelKey: str(r.labelKey),
  };
}

function mapCash(r: Record<string, unknown>): DashboardCash {
  return {
    status: asTileStatus(r.status),
    reasonKey: str(r.reasonKey) || undefined,
    businessDate: str(r.businessDate),
    countedAmount: optInt(r.countedAmount),
    expectedAmount: optInt(r.expectedAmount),
    variance: num(r.variance),
    closedAt: str(r.closedAt) || undefined,
  };
}

function mapDashApproval(raw: unknown): DashboardApproval {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    title: str(r.title),
    supplier: str(r.supplier),
    amount: num(r.amount),
    currency: str(r.currency, "IQD"),
    status: str(r.status, "open"),
  };
}

function mapWorkload(raw: unknown): WorkloadRow {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    userId: str(r.userId),
    name: str(r.name),
    department: str(r.department) || undefined,
    openTasks: num(r.openTasks),
    overdueTasks: num(r.overdueTasks),
  };
}

export function mapCashClose(raw: unknown): CashCloseView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    businessDate: str(r.businessDate),
    countedAmount: num(r.countedAmount),
    expectedAmount: optInt(r.expectedAmount),
    variance: num(r.variance),
    note: str(r.note) || undefined,
    closedAt: str(r.closedAt),
  };
}

const APPROVAL_STATUSES = new Set<ApprovalStatus>(["open", "approved", "rejected", "needs_evidence"]);

export function mapApproval(raw: unknown): SpendApproval {
  const r = (raw ?? {}) as Record<string, unknown>;
  const status = str(r.status, "open");
  return {
    id: str(r.id),
    title: str(r.title),
    supplier: str(r.supplier),
    amount: num(r.amount),
    currency: str(r.currency, "IQD"),
    evidence: str(r.evidence) || undefined,
    status: APPROVAL_STATUSES.has(status as ApprovalStatus) ? (status as ApprovalStatus) : "open",
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

function asProvider(v: unknown): AssistantProviderId {
  return v === "gemini" ? "gemini" : "openai";
}

function mapUsage(raw: unknown): AssistantUsage {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    used: num(r.used),
    limit: num(r.limit),
    remaining: num(r.remaining),
    resetsAt: str(r.resetsAt),
  };
}

function mapModelList(raw: unknown): AssistantModelOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      const o = (m ?? {}) as Record<string, unknown>;
      return { id: str(o.id), free: bool(o.free) };
    })
    .filter((m) => m.id !== "");
}

export function mapAssistantModels(raw: unknown): AssistantModelOption[] {
  return mapModelList(((raw ?? {}) as Record<string, unknown>).models);
}

function mapProviderOption(raw: unknown): AssistantProviderOption {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: asProvider(r.id),
    label: str(r.label),
    defaultModel: str(r.defaultModel),
    models: mapModelList(r.models),
  };
}

export function mapAssistantSettings(raw: unknown): AssistantSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    configured: bool(r.configured),
    enabled: bool(r.enabled),
    provider: asProvider(r.provider),
    model: str(r.model),
    keyHint: str(r.keyHint),
    dailyLimit: num(r.dailyLimit),
    providers: Array.isArray(r.providers) ? r.providers.map(mapProviderOption) : [],
  };
}

export function mapAssistantStatus(raw: unknown): AssistantStatus {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    available: bool(r.available),
    configured: bool(r.configured),
    enabled: bool(r.enabled),
    provider: r.provider ? asProvider(r.provider) : undefined,
    model: r.model ? str(r.model) : undefined,
    usage: mapUsage(r.usage),
  };
}

export function mapChatReply(raw: unknown): ChatReply {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { reply: str(r.reply), usage: mapUsage(r.usage) };
}
