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
import {
  isCafeArea,
  isCafePOSStatus,
  type CafeBranch,
  type CafeCompleteness,
  type CafeDefinition,
  type CafeMissing,
  type CafeQRSite,
  type CafeShift,
  type CafeSLA,
} from "@/domain/cafe/definition";
import type { CafeHandover, CafeHandoverRef } from "@/domain/cafe/handover";
import type { CafeIntake } from "@/domain/cafe/intake";
import { isVoiceKind, type CafeQRCode, type CafeVoice, type PublicQR } from "@/domain/cafe/qr";
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
      openRecoveries: num(pulse.openRecoveries),
      lateRecoveries: num(pulse.lateRecoveries),
      openBreakdowns: num(pulse.openBreakdowns),
      handoverOpen: bool(pulse.handoverOpen),
      intakeWritten: bool(pulse.intakeWritten),
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
  if (Array.isArray(raw)) return raw.map(map);
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) {
    return ((raw as { items: unknown[] }).items).map(map);
  }
  return [];
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

const CAFE_MISSING = new Set(["name", "timezone", "currency", "branch", "qr_site", "sla"]);

export function mapCafeDefinition(raw: unknown): CafeDefinition {
  const r = (raw ?? {}) as Record<string, unknown>;
  const sla = (r.sla ?? {}) as Record<string, unknown>;
  const completeness = (r.completeness ?? {}) as Record<string, unknown>;
  const pos = str(r.posStatus, "unknown");
  return {
    workspaceId: str(r.workspaceId),
    displayName: str(r.displayName),
    currency: str(r.currency).toUpperCase(),
    timezone: str(r.timezone),
    posVendor: str(r.posVendor),
    posStatus: isCafePOSStatus(pos) ? pos : "unknown",
    branches: Array.isArray(r.branches) ? r.branches.map(mapCafeBranch) : [],
    qrSites: Array.isArray(r.qrSites) ? r.qrSites.map(mapCafeQR) : [],
    shifts: Array.isArray(r.shifts) ? r.shifts.map(mapCafeShift) : [],
    sla: {
      ackMinutes: Math.max(0, num(sla.ackMinutes)),
      resolveMinutes: Math.max(0, num(sla.resolveMinutes)),
      afterHoursMessage: str(sla.afterHoursMessage),
      compensationLimit: Math.max(0, num(sla.compensationLimit)),
      compensationCurrency: str(sla.compensationCurrency).toUpperCase(),
    } satisfies CafeSLA,
    completeness: {
      readyForReviews: bool(completeness.readyForReviews),
      hasName: bool(completeness.hasName),
      hasTimezone: bool(completeness.hasTimezone),
      hasCurrency: bool(completeness.hasCurrency),
      hasBranch: bool(completeness.hasBranch),
      hasQRSite: bool(completeness.hasQRSite),
      hasSLA: bool(completeness.hasSLA),
      missing: Array.isArray(completeness.missing)
        ? completeness.missing.map((k) => str(k)).filter((k): k is CafeMissing => CAFE_MISSING.has(k))
        : [],
    } satisfies CafeCompleteness,
    canWrite: bool(r.canWrite),
    persisted: bool(r.persisted),
    updatedAt: str(r.updatedAt),
  };
}

function mapCafeBranch(raw: unknown): CafeBranch {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { id: str(r.id), name: str(r.name), address: str(r.address), active: bool(r.active) };
}

function mapCafeQR(raw: unknown): CafeQRSite {
  const r = (raw ?? {}) as Record<string, unknown>;
  const area = str(r.area, "other");
  return {
    id: str(r.id),
    branchId: str(r.branchId),
    label: str(r.label),
    area: isCafeArea(area) ? area : "other",
    active: bool(r.active),
  };
}

function mapCafeShift(raw: unknown): CafeShift {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { id: str(r.id), name: str(r.name), start: str(r.start), end: str(r.end) };
}

export function mapCafeQRCode(raw: unknown): CafeQRCode {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    siteId: str(r.siteId),
    label: str(r.label),
    area: str(r.area),
    branch: str(r.branch),
    active: bool(r.active),
    token: str(r.token),
    publicPath: str(r.publicPath),
    publicUrl: str(r.publicUrl),
    imagePath: str(r.imagePath),
    issuedAt: str(r.issuedAt),
  };
}

export function mapCafeVoice(raw: unknown): CafeVoice {
  const r = (raw ?? {}) as Record<string, unknown>;
  const kind = str(r.kind, "review");
  return {
    id: str(r.id),
    siteId: str(r.siteId),
    label: str(r.label),
    area: str(r.area),
    kind: isVoiceKind(kind) ? kind : "review",
    rating: num(r.rating),
    comment: str(r.comment),
    contactName: str(r.contactName),
    contactPhone: str(r.contactPhone),
    unhappy: bool(r.unhappy),
    needsRecovery: bool(r.needsRecovery),
    recoveryId: str(r.recoveryId),
    recoveryStatus: r.recoveryStatus === "open" || r.recoveryStatus === "assigned" || r.recoveryStatus === "closed" ? r.recoveryStatus : "",
    assigneeUserId: str(r.assigneeUserId),
    linkedTaskId: str(r.linkedTaskId),
    compensationAmount: num(r.compensationAmount),
    compensationCurrency: str(r.compensationCurrency),
    compensationLimit: num(r.compensationLimit),
    ackDue: str(r.ackDue),
    resolveDue: str(r.resolveDue),
    lateAck: bool(r.lateAck),
    lateResolve: bool(r.lateResolve),
    createdAt: str(r.createdAt),
  };
}

export function mapPublicQR(raw: unknown): PublicQR {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    cafeName: str(r.cafeName),
    label: str(r.label),
    area: str(r.area),
    branch: str(r.branch),
    reviewsOpen: bool(r.reviewsOpen),
    ackMinutes: num(r.ackMinutes),
    afterHoursMessage: str(r.afterHoursMessage),
    timezone: str(r.timezone),
  };
}

export function mapCafeIntake(raw: unknown): CafeIntake {
  const r = (raw ?? {}) as Record<string, unknown>;
  const shifts = Array.isArray(r.shifts) ? r.shifts.filter((s): s is string => typeof s === "string" && s.trim() !== "") : [];
  return {
    id: str(r.id),
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    shiftName: str(r.shiftName),
    shifts,
    closeNote: str(r.closeNote),
    wasteNote: str(r.wasteNote),
    incidentNote: str(r.incidentNote),
    authorUserId: str(r.authorUserId),
    authorName: str(r.authorName),
    persisted: bool(r.persisted),
    canWrite: bool(r.canWrite),
    updatedAt: str(r.updatedAt),
  };
}

function mapHandoverRef(raw: unknown): CafeHandoverRef | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = str(r.id);
  if (!id) return null;
  return { id, title: str(r.title) };
}

function mapHandoverRefs(raw: unknown): CafeHandoverRef[] {
  return Array.isArray(raw) ? raw.map(mapHandoverRef).filter((x): x is CafeHandoverRef => x !== null) : [];
}

export function mapCafeHandover(raw: unknown): CafeHandover {
  const r = (raw ?? {}) as Record<string, unknown>;
  const shifts = Array.isArray(r.shifts) ? r.shifts.filter((s): s is string => typeof s === "string" && s.trim() !== "") : [];
  const status = str(r.status);
  return {
    id: str(r.id),
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    fromShift: str(r.fromShift),
    toShift: str(r.toShift),
    status: status === "open" || status === "accepted" ? status : "",
    note: str(r.note),
    shifts,
    tasks: mapHandoverRefs(r.tasks),
    recoveries: mapHandoverRefs(r.recoveries),
    breakdowns: mapHandoverRefs(r.breakdowns),
    openedBy: str(r.openedBy),
    openedByName: str(r.openedByName),
    acceptedBy: str(r.acceptedBy),
    acceptedByName: str(r.acceptedByName),
    persisted: bool(r.persisted),
    canWrite: bool(r.canWrite),
    openedAt: str(r.openedAt),
    acceptedAt: str(r.acceptedAt),
    updatedAt: str(r.updatedAt),
  };
}
