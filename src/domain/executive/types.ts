export type DecisionStatus = "open" | "acknowledged" | "assigned" | "resolved";
export type DecisionAction = "acknowledge" | "assign" | "resolve";
export type SourceStatus = "live" | "unavailable";

export interface BriefPulse {
  overdueTasks: number;
  openTasks: number;
  completedToday: number;
  openRecoveries: number;
  lateRecoveries: number;
  openBreakdowns: number;
  handoverOpen: boolean;
  intakeWritten: boolean;
  openChecks: number;
  openDone: number;
  closeChecks: number;
  closeDone: number;
  waitingPrep: number;
  readyPrep: number;
  servedPrep: number;
  wasteTickets: number;
  wasteGrams: number;
  wasteCost: number;
}

export interface BriefHeadline {
  overdueTasks: number;
  pendingDecisions: number;
  assignedFollowups: number;
}

export interface BriefDecision {
  id: string;
  status: DecisionStatus;
  assigneeUserId?: string;
  linkedTaskId?: string;
}

export interface BriefCard {
  sourceKey: string;
  fingerprint: string;
  kind: string;
  severity: string;
  titleKey: string;
  detail?: string;
  count: number;
  priority: number;
  targetTab: string;
  allowedActions: DecisionAction[];
  decision: BriefDecision | null;
}

export interface BriefSource {
  kind: string;
  status: SourceStatus;
  reasonKey?: string;
}

export interface BriefView {
  generatedAt: string;
  date: string;
  workspaceKind: string;
  headline: BriefHeadline;
  pulse: BriefPulse;
  cards: BriefCard[];
  sources: BriefSource[];
  snoozedCount: number;
  isClear: boolean;
}

export interface ActCommand {
  sourceKey: string;
  fingerprint: string;
  kind: string;
  titleKey: string;
  detail?: string;
  severity: string;
  targetTab: string;
  action: DecisionAction;
  assigneeUserId?: string;
  title?: string;
  description?: string;
}

export interface DecisionView {
  id: string;
  sourceKey: string;
  fingerprint: string;
  kind: string;
  status: DecisionStatus;
  assigneeUserId?: string;
  linkedTaskId?: string;
  snoozeUntil?: string;
}
