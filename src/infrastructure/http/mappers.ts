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
  MeetingItem,
  MeetingView,
  TranscribeView,
  TranslateView,
} from "@/domain/assistant/types";
import type { DocumentMetric, SimplifiedSummary, WorkspaceDocument } from "@/domain/docintake/types";
import type {
  DepartmentReadiness,
  HotelComparison,
  HotelFreshness,
  HotelPMSView,
  HotelProfile,
  OHIPConfigView,
  PMSSnapshotSummary,
  PMSSnapshotView,
  ReservationRow,
} from "@/domain/hotel/pms";
import type {
  CafeCard,
  CafeProfitability,
  ChannelStatus,
  CurrencyTotal,
  HotelCard,
  PortfolioRecentDoc,
  PortfolioView,
  WorkspaceCompleteness,
} from "@/domain/portfolio/types";
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
import type { CafeCheckLine, CafeChecklist, CheckKind } from "@/domain/cafe/checklist";
import type { POSDay, POSTender, POSTicket, POSTicketKind } from "@/domain/cafe/pos";
import type { PrepDay, PrepStation, PrepStatus, PrepTicket } from "@/domain/cafe/prep";
import type {
  StockAdjustment,
  StockAdjustReason,
  StockDay,
  StockItem,
  StockStation,
  StockUnit,
} from "@/domain/cafe/stock";
import type { Recipe, WasteDay, WasteReason, WasteStation, WasteTicket } from "@/domain/cafe/waste";
import { isCheckKind } from "@/domain/cafe/checklist";
import type { CafeHandover, CafeHandoverRef } from "@/domain/cafe/handover";
import type { CafeIntake } from "@/domain/cafe/intake";
import { isVoiceKind, type CafeQRCode, type CafeVoice, type PublicQR } from "@/domain/cafe/qr";
import type {
  DashboardApproval,
  DashboardCash,
  DashboardPulse,
  DashboardSales,
  DashboardTile,
  DashboardView,
  DashboardWaste,
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
  const workspaces = Array.isArray(r.workspaces)
    ? r.workspaces.map((w): WorkspaceOption => {
        const o = (w ?? {}) as Record<string, unknown>;
        return {
          id: str(o.id),
          name: str(o.name),
          kind: str(o.kind),
          slug: str(o.slug),
          timezone: str(o.timezone) || undefined,
        };
      })
    : undefined;
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
      timezone: str(workspace.timezone) || undefined,
    },
    workspaces,
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
        return { id: str(o.id), name: str(o.name), kind: str(o.kind), slug: str(o.slug), timezone: str(o.timezone) || undefined };
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
      openChecks: num(pulse.openChecks),
      openDone: num(pulse.openDone),
      closeChecks: num(pulse.closeChecks),
      closeDone: num(pulse.closeDone),
      waitingPrep: num(pulse.waitingPrep),
      readyPrep: num(pulse.readyPrep),
      servedPrep: num(pulse.servedPrep),
      wasteTickets: num(pulse.wasteTickets),
      wasteGrams: num(pulse.wasteGrams),
      wasteCost: num(pulse.wasteCost),
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
    sales: r.sales && typeof r.sales === "object" ? mapDashSales(r.sales as Record<string, unknown>) : undefined,
    waste: r.waste && typeof r.waste === "object" ? mapDashWaste(r.waste as Record<string, unknown>) : undefined,
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

function mapDashSales(r: Record<string, unknown>): DashboardSales {
  return {
    status: asTileStatus(r.status),
    reasonKey: str(r.reasonKey) || undefined,
    businessDate: str(r.businessDate),
    ticketCount: num(r.ticketCount),
    saleCount: num(r.saleCount),
    returnCount: num(r.returnCount),
    gross: num(r.gross),
    discount: num(r.discount),
    returns: num(r.returns),
    net: num(r.net),
    basket: num(r.basket),
    cash: num(r.cash),
    card: num(r.card),
    other: num(r.other),
    closed: bool(r.closed),
    closedAt: str(r.closedAt) || undefined,
  };
}

function mapDashWaste(r: Record<string, unknown>): DashboardWaste {
  return {
    status: asTileStatus(r.status),
    reasonKey: str(r.reasonKey) || undefined,
    businessDate: str(r.businessDate),
    ticketCount: num(r.ticketCount),
    grams: num(r.grams),
    cost: num(r.cost),
    kitchenGrams: num(r.kitchenGrams),
    barGrams: num(r.barGrams),
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
    evidence: str(r.evidence) || undefined,
    version: Math.max(1, Math.trunc(num(r.version, 1))),
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
    version: Math.max(1, Math.trunc(num(r.version, 1))),
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

function mapCheckPulse(raw: unknown): { total: number; done: number; remaining: number } {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { total: num(r.total), done: num(r.done), remaining: num(r.remaining) };
}

function mapCheckLine(raw: unknown): CafeCheckLine | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const kind = str(r.kind);
  const id = str(r.id);
  if (!id || !isCheckKind(kind)) return null;
  return {
    id,
    kind: kind as CheckKind,
    title: str(r.title),
    sort: num(r.sort),
    active: r.active !== false,
    done: bool(r.done),
    doneAt: str(r.doneAt),
    doneBy: str(r.doneBy),
    doneByName: str(r.doneByName),
  };
}

export function mapCafeChecklist(raw: unknown): CafeChecklist {
  const r = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(r.items) ? r.items.map(mapCheckLine).filter((x): x is CafeCheckLine => x !== null) : [];
  return {
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    items,
    open: mapCheckPulse(r.open),
    close: mapCheckPulse(r.close),
    hasList: bool(r.hasList),
    canEdit: bool(r.canEdit),
    canCheck: bool(r.canCheck),
  };
}

const POS_KINDS = new Set<POSTicketKind>(["sale", "return"]);
const POS_TENDERS = new Set<POSTender>(["cash", "card", "other"]);

function mapPOSTicket(raw: unknown): POSTicket | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const kind = str(r.kind);
  const tender = str(r.tender);
  const id = str(r.id);
  if (!id || !POS_KINDS.has(kind as POSTicketKind) || !POS_TENDERS.has(tender as POSTender)) return null;
  return {
    id,
    externalRef: str(r.externalRef),
    businessDate: str(r.businessDate),
    kind: kind as POSTicketKind,
    lines: num(r.lines),
    gross: num(r.gross),
    discount: num(r.discount),
    net: num(r.net),
    tender: tender as POSTender,
    recordedAt: str(r.recordedAt),
  };
}

export function mapPOSDay(raw: unknown): POSDay {
  const r = (raw ?? {}) as Record<string, unknown>;
  const tickets = Array.isArray(r.tickets) ? r.tickets.map(mapPOSTicket).filter((x): x is POSTicket => x !== null) : [];
  return {
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    status: r.status === "live" ? "live" : "unavailable",
    reasonKey: str(r.reasonKey) || undefined,
    ticketCount: num(r.ticketCount),
    saleCount: num(r.saleCount),
    returnCount: num(r.returnCount),
    gross: num(r.gross),
    discount: num(r.discount),
    returns: num(r.returns),
    net: num(r.net),
    basket: num(r.basket),
    cash: num(r.cash),
    card: num(r.card),
    other: num(r.other),
    closed: bool(r.closed),
    closedAt: str(r.closedAt) || undefined,
    tickets,
    canRecord: bool(r.canRecord),
  };
}

const PREP_STATIONS = new Set<PrepStation>(["kitchen", "bar"]);
const PREP_STATUSES = new Set<PrepStatus>(["waiting", "ready", "served"]);

function mapPrepTicket(raw: unknown): PrepTicket | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const station = str(r.station);
  const status = str(r.status);
  const id = str(r.id);
  if (!id || !PREP_STATIONS.has(station as PrepStation) || !PREP_STATUSES.has(status as PrepStatus)) return null;
  return {
    id,
    ticketRef: str(r.ticketRef),
    tableLabel: str(r.tableLabel) || undefined,
    station: station as PrepStation,
    status: status as PrepStatus,
    waitMinutes: num(r.waitMinutes),
    openMinutes: num(r.openMinutes),
    receivedAt: str(r.receivedAt),
    readyAt: str(r.readyAt) || undefined,
    servedAt: str(r.servedAt) || undefined,
    businessDate: str(r.businessDate),
  };
}

export function mapPrepDay(raw: unknown): PrepDay {
  const r = (raw ?? {}) as Record<string, unknown>;
  const tickets = Array.isArray(r.tickets) ? r.tickets.map(mapPrepTicket).filter((x): x is PrepTicket => x !== null) : [];
  return {
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    status: r.status === "live" ? "live" : "unavailable",
    reasonKey: str(r.reasonKey) || undefined,
    ticketCount: num(r.ticketCount),
    waitingCount: num(r.waitingCount),
    readyCount: num(r.readyCount),
    servedCount: num(r.servedCount),
    longestOpenMinutes: num(r.longestOpenMinutes),
    tickets,
    canRecord: bool(r.canRecord),
  };
}

const WASTE_STATIONS = new Set<WasteStation>(["kitchen", "bar"]);
const WASTE_REASONS = new Set<WasteReason>(["prep", "spoilage", "overcook", "other"]);

function mapRecipe(raw: unknown): Recipe | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const station = str(r.station);
  const id = str(r.id);
  if (!id || !WASTE_STATIONS.has(station as WasteStation)) return null;
  const lines = Array.isArray(r.lines)
    ? r.lines
        .map((item) => {
          const line = (item ?? {}) as Record<string, unknown>;
          const title = str(line.title);
          const grams = num(line.grams);
          if (!title || grams < 1) return null;
          return { title, grams };
        })
        .filter((x): x is { title: string; grams: number } => x !== null)
    : [];
  return { id, name: str(r.name), station: station as WasteStation, lines };
}

function mapWasteTicket(raw: unknown): WasteTicket | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const station = str(r.station);
  const reason = str(r.reason, "other");
  const id = str(r.id);
  if (!id || !WASTE_STATIONS.has(station as WasteStation)) return null;
  return {
    id,
    item: str(r.item),
    station: station as WasteStation,
    grams: num(r.grams),
    cost: num(r.cost),
    reason: WASTE_REASONS.has(reason as WasteReason) ? (reason as WasteReason) : "other",
    note: str(r.note) || undefined,
    recipeId: str(r.recipeId) || undefined,
    recordedAt: str(r.recordedAt),
    businessDate: str(r.businessDate),
  };
}

export function mapWasteDay(raw: unknown): WasteDay {
  const r = (raw ?? {}) as Record<string, unknown>;
  const tickets = Array.isArray(r.tickets) ? r.tickets.map(mapWasteTicket).filter((x): x is WasteTicket => x !== null) : [];
  const recipes = Array.isArray(r.recipes) ? r.recipes.map(mapRecipe).filter((x): x is Recipe => x !== null) : [];
  return {
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    status: r.status === "live" ? "live" : "unavailable",
    reasonKey: str(r.reasonKey) || undefined,
    ticketCount: num(r.ticketCount),
    grams: num(r.grams),
    cost: num(r.cost),
    kitchenGrams: num(r.kitchenGrams),
    barGrams: num(r.barGrams),
    tickets,
    recipes,
    canRecord: bool(r.canRecord),
    canEditRecipes: bool(r.canEditRecipes),
  };
}

function mapStockStation(raw: unknown): StockStation {
  return raw === "bar" ? "bar" : "kitchen";
}

function mapStockUnit(raw: unknown): StockUnit {
  if (raw === "ml" || raw === "ea") return raw;
  return "g";
}

function mapStockReason(raw: unknown): StockAdjustReason {
  if (raw === "count" || raw === "receive" || raw === "use" || raw === "spoil") return raw;
  return "other";
}

function mapStockItem(raw: unknown): StockItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const name = str(r.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    station: mapStockStation(r.station),
    unit: mapStockUnit(r.unit),
    onHand: num(r.onHand),
    par: num(r.par),
    level: Math.max(0, Math.min(100, Math.round(num(r.level)))),
    active: bool(r.active),
    low: bool(r.low),
  };
}

function mapStockAdjustment(raw: unknown): StockAdjustment | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const itemId = str(r.itemId);
  if (!id || !itemId) return null;
  return {
    id,
    itemId,
    itemName: str(r.itemName),
    delta: num(r.delta),
    onHandAfter: num(r.onHandAfter),
    reason: mapStockReason(r.reason),
    note: str(r.note) || undefined,
    recordedAt: str(r.recordedAt),
    businessDate: str(r.businessDate),
  };
}

export function mapStockDay(raw: unknown): StockDay {
  const r = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(r.items) ? r.items.map(mapStockItem).filter((x): x is StockItem => x !== null) : [];
  const adjustments = Array.isArray(r.adjustments)
    ? r.adjustments.map(mapStockAdjustment).filter((x): x is StockAdjustment => x !== null)
    : [];
  return {
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    status: r.status === "live" ? "live" : "unavailable",
    reasonKey: str(r.reasonKey) || undefined,
    itemCount: num(r.itemCount),
    lowCount: num(r.lowCount),
    items,
    adjustments,
    canRecord: bool(r.canRecord),
    canEditCatalog: bool(r.canEditCatalog),
  };
}

export function mapWorkspaceList(raw: unknown): WorkspaceOption[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(r.workspaces) ? r.workspaces : [];
  return list.map((w): WorkspaceOption => {
    const o = (w ?? {}) as Record<string, unknown>;
    return { id: str(o.id), name: str(o.name), kind: str(o.kind), slug: str(o.slug), timezone: str(o.timezone) || undefined };
  });
}

function asFreshness(raw: unknown): HotelFreshness {
  if (raw === "current" || raw === "delayed" || raw === "stale") return raw;
  return "unavailable";
}

export function mapOHIPConfig(raw: unknown): OHIPConfigView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    configured: bool(r.configured),
    enabled: bool(r.enabled),
    hostUrl: str(r.hostUrl) || undefined,
    hotelId: str(r.hotelId) || undefined,
    clientId: str(r.clientId) || undefined,
    secretHint: str(r.secretHint) || undefined,
    appKeyHint: str(r.appKeyHint) || undefined,
    syncMode: r.syncMode === "ohip_api" ? "ohip_api" : "opera_export",
    lastSyncAt: str(r.lastSyncAt) || undefined,
    lastSyncStatus: r.lastSyncStatus === "ok" || r.lastSyncStatus === "error" ? r.lastSyncStatus : "never",
    lastError: str(r.lastError) || undefined,
  };
}

function mapReadiness(raw: unknown): DepartmentReadiness | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    department: str(r.department),
    total: num(r.total),
    completed: num(r.completed),
    note: str(r.note) || undefined,
  };
}

function mapReservation(raw: unknown): ReservationRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const statusRaw = str(r.status, "reserved");
  const status =
    statusRaw === "checked_in" || statusRaw === "checked_out" || statusRaw === "cancelled" || statusRaw === "no_show"
      ? statusRaw
      : "reserved";
  return {
    confirmationNo: str(r.confirmationNo),
    guestName: str(r.guestName),
    roomType: str(r.roomType),
    status,
    arrivalDate: str(r.arrivalDate),
    departureDate: str(r.departureDate),
    nights: num(r.nights),
    rateMinor: num(r.rateMinor),
    currency: str(r.currency, "USD"),
    channel: str(r.channel) || undefined,
    vip: bool(r.vip),
  };
}

function mapPMSSnapshot(raw: unknown): PMSSnapshotView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    businessDate: str(r.businessDate),
    source: str(r.source),
    externalBatchRef: str(r.externalBatchRef) || undefined,
    currency: str(r.currency, "USD"),
    totalRooms: num(r.totalRooms),
    availableRooms: num(r.availableRooms),
    occupiedRooms: num(r.occupiedRooms),
    outOfOrderRooms: num(r.outOfOrderRooms),
    occupancyPct: num(r.occupancyPct),
    roomRevenueMinor: num(r.roomRevenueMinor),
    fbRevenueMinor: num(r.fbRevenueMinor),
    otherRevenueMinor: num(r.otherRevenueMinor),
    totalRevenueMinor: num(r.totalRevenueMinor),
    adrMinor: num(r.adrMinor),
    revparMinor: num(r.revparMinor),
    arrivalsCount: num(r.arrivalsCount),
    departuresCount: num(r.departuresCount),
    inHouseGuests: num(r.inHouseGuests),
    reservationsCount: num(r.reservationsCount),
    cancelledCount: num(r.cancelledCount),
    noShowCount: num(r.noShowCount),
    readiness: Array.isArray(r.readiness)
      ? r.readiness.map(mapReadiness).filter((x): x is DepartmentReadiness => x !== null)
      : [],
    readinessPct: num(r.readinessPct),
    reservations: Array.isArray(r.reservations)
      ? r.reservations.map(mapReservation).filter((x): x is ReservationRow => x !== null)
      : [],
    capturedAt: str(r.capturedAt),
  };
}

export function mapHotelPMS(raw: unknown): HotelPMSView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const compRaw = r.comparison && typeof r.comparison === "object" ? (r.comparison as Record<string, unknown>) : null;
  const comparison: HotelComparison | undefined = compRaw
    ? {
        yesterdayDate: str(compRaw.yesterdayDate),
        hasYesterday: bool(compRaw.hasYesterday),
        yesterdayRevenueMinor: num(compRaw.yesterdayRevenueMinor),
        revenueDeltaMinor: num(compRaw.revenueDeltaMinor),
        revenueDeltaPct: typeof compRaw.revenueDeltaPct === "number" ? compRaw.revenueDeltaPct : undefined,
        yesterdayOccupancyPct: typeof compRaw.yesterdayOccupancyPct === "number" ? compRaw.yesterdayOccupancyPct : undefined,
        occupancyDeltaPts: typeof compRaw.occupancyDeltaPts === "number" ? compRaw.occupancyDeltaPts : undefined,
      }
    : undefined;
  const recentDays: PMSSnapshotSummary[] = Array.isArray(r.recentDays)
    ? r.recentDays.map((item) => {
        const o = (item ?? {}) as Record<string, unknown>;
        return {
          businessDate: str(o.businessDate),
          currency: str(o.currency, "USD"),
          occupancyPct: num(o.occupancyPct),
          totalRevenueMinor: num(o.totalRevenueMinor),
          roomRevenueMinor: num(o.roomRevenueMinor),
          adrMinor: num(o.adrMinor),
          revparMinor: num(o.revparMinor),
          reservationsCount: num(o.reservationsCount),
          source: str(o.source),
        };
      })
    : [];
  return {
    workspaceId: str(r.workspaceId),
    workspaceName: str(r.workspaceName),
    businessDate: str(r.businessDate),
    timezone: str(r.timezone),
    freshness: asFreshness(r.freshness),
    reasonKey: str(r.reasonKey) || undefined,
    replayed: bool(r.replayed),
    connector: mapOHIPConfig(r.connector),
    today: r.today ? mapPMSSnapshot(r.today) : undefined,
    comparison,
    recentDays,
    canManageOhip: bool(r.canManageOhip),
    canRecord: bool(r.canRecord),
    profile: mapHotelProfile(r.profile),
  };
}

export function mapHotelProfile(raw: unknown): HotelProfile {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    displayName: str(r.displayName),
    totalRooms: num(r.totalRooms),
    currency: str(r.currency, "USD"),
    timezone: str(r.timezone),
    starRating: num(r.starRating),
    city: str(r.city),
    address: str(r.address),
    phone: str(r.phone),
    gmName: str(r.gmName),
    notes: str(r.notes),
    updatedAt: str(r.updatedAt) || undefined,
    persisted: bool(r.persisted),
    canWrite: bool(r.canWrite),
  };
}

function mapSimplifiedSummary(raw: unknown): SimplifiedSummary {
  const r = (raw ?? {}) as Record<string, unknown>;
  const metrics: DocumentMetric[] = Array.isArray(r.keyMetrics)
    ? r.keyMetrics.map((m) => {
        const o = (m ?? {}) as Record<string, unknown>;
        return { label: str(o.label), value: str(o.value) };
      })
    : [];
  return {
    headline: str(r.headline),
    keyMetrics: metrics,
    takeaways: Array.isArray(r.takeaways) ? r.takeaways.map((s) => str(s)).filter(Boolean) : [],
    risks: Array.isArray(r.risks) ? r.risks.map((s) => str(s)).filter(Boolean) : [],
    actions: Array.isArray(r.actions) ? r.actions.map((s) => str(s)).filter(Boolean) : [],
    rowCount: num(r.rowCount),
    columnCount: num(r.columnCount),
    missingCells: num(r.missingCells),
    dataCoveragePct: num(r.dataCoveragePct),
  };
}

export function mapWorkspaceDocument(raw: unknown): WorkspaceDocument {
  const r = (raw ?? {}) as Record<string, unknown>;
  const kind = str(r.sourceKind);
  return {
    id: str(r.id),
    workspaceId: str(r.workspaceId),
    businessDate: str(r.businessDate),
    fileName: str(r.fileName),
    sourceKind: kind === "csv" || kind === "json" || kind === "opera_report" ? kind : "txt",
    status: r.status === "analyzed" ? "analyzed" : "fallback_structured",
    aiUsed: bool(r.aiUsed),
    dataCoveragePct: num(r.dataCoveragePct),
    summary: mapSimplifiedSummary(r.summary),
    replayed: bool(r.replayed),
    createdAt: str(r.createdAt),
  };
}

export function mapWorkspaceDocumentList(raw: unknown): WorkspaceDocument[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(r.documents) ? r.documents : [];
  return list.map(mapWorkspaceDocument);
}

export function mapPortfolioView(raw: unknown): PortfolioView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const comp = (r.completeness ?? {}) as Record<string, unknown>;
  const hotels = (r.hotels ?? {}) as Record<string, unknown>;
  const cafes = (r.cafes ?? {}) as Record<string, unknown>;

  const byWorkspace: WorkspaceCompleteness[] = Array.isArray(comp.byWorkspace)
    ? comp.byWorkspace.map((w) => {
        const o = (w ?? {}) as Record<string, unknown>;
        const channels: ChannelStatus[] = Array.isArray(o.channels)
          ? o.channels.map((c) => {
              const ch = (c ?? {}) as Record<string, unknown>;
              return { key: str(ch.key), entered: bool(ch.entered), updatedAt: str(ch.updatedAt) || undefined };
            })
          : [];
        return {
          workspaceId: str(o.workspaceId),
          workspaceName: str(o.workspaceName),
          kind: str(o.kind),
          enteredCount: num(o.enteredCount),
          expectedCount: num(o.expectedCount),
          pct: num(o.pct),
          channels,
        };
      })
    : [];

  const totalsByCurrency: CurrencyTotal[] = Array.isArray(hotels.totalsByCurrency)
    ? hotels.totalsByCurrency.map((t) => {
        const o = (t ?? {}) as Record<string, unknown>;
        return {
          currency: str(o.currency),
          hotelCount: num(o.hotelCount),
          todayTotalRevenueMinor: num(o.todayTotalRevenueMinor),
          todayRoomRevenueMinor: num(o.todayRoomRevenueMinor),
          yesterdayRevenueMinor: num(o.yesterdayRevenueMinor),
          hasYesterday: bool(o.hasYesterday),
          deltaMinor: num(o.deltaMinor),
          deltaPct: typeof o.deltaPct === "number" ? o.deltaPct : undefined,
        };
      })
    : [];

  const hotelCards: HotelCard[] = Array.isArray(hotels.hotels)
    ? hotels.hotels.map((h) => {
        const o = (h ?? {}) as Record<string, unknown>;
        return {
          workspaceId: str(o.workspaceId),
          name: str(o.name),
          slug: str(o.slug),
          businessDate: str(o.businessDate),
          freshness: asFreshness(o.freshness),
          source: str(o.source) || undefined,
          currency: str(o.currency) || undefined,
          totalRooms: num(o.totalRooms),
          availableRooms: num(o.availableRooms),
          occupiedRooms: num(o.occupiedRooms),
          outOfOrderRooms: num(o.outOfOrderRooms),
          occupancyPct: typeof o.occupancyPct === "number" ? o.occupancyPct : undefined,
          roomRevenueMinor: num(o.roomRevenueMinor),
          fbRevenueMinor: num(o.fbRevenueMinor),
          otherRevenueMinor: num(o.otherRevenueMinor),
          totalRevenueMinor: num(o.totalRevenueMinor),
          adrMinor: num(o.adrMinor),
          revparMinor: num(o.revparMinor),
          arrivalsCount: num(o.arrivalsCount),
          departuresCount: num(o.departuresCount),
          reservationsCount: num(o.reservationsCount),
          yesterdayRevenueMinor: num(o.yesterdayRevenueMinor),
          hasYesterday: bool(o.hasYesterday),
          revenueDeltaMinor: num(o.revenueDeltaMinor),
          revenueDeltaPct: typeof o.revenueDeltaPct === "number" ? o.revenueDeltaPct : undefined,
          readinessPct: num(o.readinessPct),
          completenessPct: num(o.completenessPct),
          openTasks: num(o.openTasks),
          overdueTasks: num(o.overdueTasks),
          openReports: num(o.openReports),
          ohipConfigured: bool(o.ohipConfigured),
          ohipLastSyncStatus: str(o.ohipLastSyncStatus, "never"),
        };
      })
    : [];

  const cafeCards: CafeCard[] = Array.isArray(cafes.cafes)
    ? cafes.cafes.map((c) => {
        const o = (c ?? {}) as Record<string, unknown>;
        const prof = (o.profitability ?? {}) as Record<string, unknown>;
        const profitability: CafeProfitability = {
          status: prof.status === "live" || prof.status === "provisional" ? prof.status : "unavailable",
          currency: str(prof.currency, "IQD"),
          salesNet: num(prof.salesNet),
          wasteCost: num(prof.wasteCost),
          approvedExpenses: num(prof.approvedExpenses),
          pendingApprovalsCount: num(prof.pendingApprovalsCount),
          estimatedNet: num(prof.estimatedNet),
          marginPct: typeof prof.marginPct === "number" ? prof.marginPct : undefined,
          complete: bool(prof.complete),
        };
        return {
          workspaceId: str(o.workspaceId),
          name: str(o.name),
          slug: str(o.slug),
          businessDate: str(o.businessDate),
          salesStatus: o.salesStatus === "live" ? "live" : "unavailable",
          salesNet: num(o.salesNet),
          salesGross: num(o.salesGross),
          ticketCount: num(o.ticketCount),
          posClosed: bool(o.posClosed),
          wasteStatus: o.wasteStatus === "live" ? "live" : "unavailable",
          wasteCost: num(o.wasteCost),
          wasteGrams: num(o.wasteGrams),
          stockStatus: o.stockStatus === "live" ? "live" : "unavailable",
          stockItems: num(o.stockItems),
          stockLowCount: num(o.stockLowCount),
          cashStatus: o.cashStatus === "live" ? "live" : "unavailable",
          cashVariance: num(o.cashVariance),
          profitability,
          completenessPct: num(o.completenessPct),
          openTasks: num(o.openTasks),
          overdueTasks: num(o.overdueTasks),
          openReports: num(o.openReports),
          openRecoveries: num(o.openRecoveries),
        };
      })
    : [];

  const recentDocuments: PortfolioRecentDoc[] = Array.isArray(r.recentDocuments)
    ? r.recentDocuments.map((d) => {
        const o = (d ?? {}) as Record<string, unknown>;
        return {
          id: str(o.id),
          workspaceId: str(o.workspaceId),
          workspaceName: str(o.workspaceName),
          workspaceKind: str(o.workspaceKind),
          businessDate: str(o.businessDate),
          fileName: str(o.fileName),
          sourceKind: str(o.sourceKind),
          status: str(o.status),
          aiUsed: bool(o.aiUsed),
          dataCoveragePct: num(o.dataCoveragePct),
          summary: mapSimplifiedSummary(o.summary),
          createdAt: str(o.createdAt),
        };
      })
    : [];

  return {
    generatedAt: str(r.generatedAt),
    date: str(r.date),
    workspaceCount: num(r.workspaceCount),
    completeness: { overallPct: num(comp.overallPct), byWorkspace },
    hotels: {
      count: num(hotels.count),
      connectedCount: num(hotels.connectedCount),
      avgOccupancyPct: typeof hotels.avgOccupancyPct === "number" ? hotels.avgOccupancyPct : undefined,
      totalRooms: num(hotels.totalRooms),
      availableRooms: num(hotels.availableRooms),
      occupiedRooms: num(hotels.occupiedRooms),
      outOfOrderRooms: num(hotels.outOfOrderRooms),
      totalArrivals: num(hotels.totalArrivals),
      totalDepartures: num(hotels.totalDepartures),
      totalsByCurrency,
      hotels: hotelCards,
    },
    cafes: { count: num(cafes.count), cafes: cafeCards },
    recentDocuments,
  };
}

export function mapTranslateView(raw: unknown): TranslateView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    translated: str(r.translated),
    simpleExplanation: str(r.simpleExplanation) || undefined,
    toneNote: str(r.toneNote) || undefined,
    suggestedReply: str(r.suggestedReply) || undefined,
    sourceLang: str(r.sourceLang),
    targetLang: str(r.targetLang),
    mode: r.mode === "explain_term" ? "explain_term" : "translate",
    usage: mapUsage(r.usage),
  };
}

function mapMeetingItem(raw: unknown): MeetingItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = str(r.text);
  if (!text) return null;
  return {
    text,
    owner: str(r.owner) || undefined,
    dueAt: str(r.dueAt) || undefined,
    ambiguous: bool(r.ambiguous),
  };
}

export function mapMeetingView(raw: unknown): MeetingView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    title: str(r.title),
    businessDate: str(r.businessDate),
    participants: Array.isArray(r.participants) ? r.participants.map((p) => str(p)).filter(Boolean) : [],
    transcript: str(r.transcript),
    translatedTranscript: str(r.translatedTranscript),
    summary: str(r.summary),
    decisions: Array.isArray(r.decisions)
      ? r.decisions.map(mapMeetingItem).filter((x): x is MeetingItem => x !== null)
      : [],
    actionItems: Array.isArray(r.actionItems)
      ? r.actionItems.map(mapMeetingItem).filter((x): x is MeetingItem => x !== null)
      : [],
    sourceLocale: str(r.sourceLocale),
    targetLocale: str(r.targetLocale),
    aiUsed: bool(r.aiUsed),
    createdAt: str(r.createdAt),
  };
}

export function mapMeetingList(raw: unknown): MeetingView[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(r.meetings) ? r.meetings : [];
  return list.map(mapMeetingView);
}

export function mapTranscribeView(raw: unknown): TranscribeView {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    text: str(r.text),
    detectedLanguage: str(r.detectedLanguage),
  };
}
