import type { Tone } from "@/theme/tones";
import type { BriefCard, BriefView } from "./types";

export type TodayKpiId = "overdue" | "open" | "done";

export interface TodayKpiSpec {
  id: TodayKpiId;
  tone: Tone;
  valueKey: "overdueTasks" | "openTasks" | "completedToday";
  labelKey: "overdue" | "open" | "completedToday";
}

export const TODAY_KPIS: readonly TodayKpiSpec[] = [
  { id: "overdue", tone: "rose", valueKey: "overdueTasks", labelKey: "overdue" },
  { id: "open", tone: "amber", valueKey: "openTasks", labelKey: "open" },
  { id: "done", tone: "emerald", valueKey: "completedToday", labelKey: "completedToday" },
];

export type FloorKpiId = "recoveries" | "breakdowns" | "handover" | "close" | "checks" | "prep";

export interface FloorKpi {
  id: FloorKpiId;
  tone: Tone;
  value: number;
  labelKey: "floorRecoveries" | "floorBreakdowns" | "floorHandover" | "floorClose" | "floorChecks" | "floorPrep";
  captionKey: "floorLate" | "floorHandoverOpen" | "floorHandoverQuiet" | "floorCloseWritten" | "floorCloseOpen" | "floorChecksQuiet" | "floorChecksOpen" | "floorChecksDone" | "floorPrepQuiet" | "floorPrepOpen" | "floorPrepDone" | null;
}

export type HeadlinePartKey =
  | "headlineOverdue"
  | "headlineOverdueOne"
  | "headlinePending"
  | "headlinePendingOne"
  | "headlineAssigned"
  | "headlineAssignedOne";

export interface HeadlinePart {
  one: HeadlinePartKey;
  many: HeadlinePartKey;
  n: number;
}

export type CardIconKey = "late_staff" | "customer_voice" | "reservations" | "cash_variance" | "handover" | "breakdown" | "prep_time";

export type CardTitleKey =
  | "overdueTasks"
  | "reviewInbox"
  | "allClear"
  | "cashVariance"
  | "floorHandover"
  | "floorBreakdowns"
  | "prepWaiting";

export type SourceCopyKey =
  | "sourceLateStaff"
  | "sourceCustomerVoice"
  | "sourceReservations"
  | "sourceCash"
  | "sourceHandover"
  | "sourceBreakdown"
  | "sourceDailyClose"
  | "sourceChecklist"
  | "sourcePrep";

export function todayKpis(pulse: BriefView["pulse"]): Array<TodayKpiSpec & { value: number }> {
  return TODAY_KPIS.map((spec) => ({ ...spec, value: pulse[spec.valueKey] }));
}

export function floorKpis(pulse: BriefView["pulse"]): FloorKpi[] {
  return [
    {
      id: "recoveries",
      tone: pulse.lateRecoveries > 0 ? "rose" : "sky",
      value: pulse.openRecoveries,
      labelKey: "floorRecoveries",
      captionKey: pulse.lateRecoveries > 0 ? "floorLate" : null,
    },
    {
      id: "breakdowns",
      tone: "rose",
      value: pulse.openBreakdowns,
      labelKey: "floorBreakdowns",
      captionKey: null,
    },
    {
      id: "handover",
      tone: "violet",
      value: pulse.handoverOpen ? 1 : 0,
      labelKey: "floorHandover",
      captionKey: pulse.handoverOpen ? "floorHandoverOpen" : "floorHandoverQuiet",
    },
    {
      id: "close",
      tone: "teal",
      value: pulse.intakeWritten ? 1 : 0,
      labelKey: "floorClose",
      captionKey: pulse.intakeWritten ? "floorCloseWritten" : "floorCloseOpen",
    },
    {
      id: "checks",
      tone: "indigo",
      value: (pulse.openChecks || 0) + (pulse.closeChecks || 0) === 0 ? 0 : (pulse.openChecks - pulse.openDone) + (pulse.closeChecks - pulse.closeDone),
      labelKey: "floorChecks",
      captionKey:
        (pulse.openChecks || 0) + (pulse.closeChecks || 0) === 0
          ? "floorChecksQuiet"
          : (pulse.openChecks - pulse.openDone) + (pulse.closeChecks - pulse.closeDone) === 0
            ? "floorChecksDone"
            : "floorChecksOpen",
    },
    {
      id: "prep",
      tone: (pulse.waitingPrep || 0) > 0 ? "amber" : "teal",
      value: (pulse.waitingPrep || 0) + (pulse.readyPrep || 0),
      labelKey: "floorPrep",
      captionKey:
        (pulse.waitingPrep || 0) + (pulse.readyPrep || 0) + (pulse.servedPrep || 0) === 0
          ? "floorPrepQuiet"
          : (pulse.waitingPrep || 0) + (pulse.readyPrep || 0) === 0
            ? "floorPrepDone"
            : "floorPrepOpen",
    },
  ];
}

export function headlineParts(brief: BriefView): HeadlinePart[] {
  if (brief.isClear) return [];
  const parts: HeadlinePart[] = [];
  if (brief.headline.overdueTasks > 0) {
    parts.push({ one: "headlineOverdueOne", many: "headlineOverdue", n: brief.headline.overdueTasks });
  }
  if (brief.headline.pendingDecisions > 0) {
    parts.push({ one: "headlinePendingOne", many: "headlinePending", n: brief.headline.pendingDecisions });
  }
  if (brief.headline.assignedFollowups > 0) {
    parts.push({ one: "headlineAssignedOne", many: "headlineAssigned", n: brief.headline.assignedFollowups });
  }
  return parts;
}

export function emptyBriefKey(brief: BriefView): "allClear" | "handledUntilTomorrow" | "noMorningCards" {
  if (brief.cards.length > 0) return "allClear";
  if (brief.snoozedCount > 0 && brief.pulse.overdueTasks > 0) return "handledUntilTomorrow";
  return brief.isClear ? "allClear" : "noMorningCards";
}

export function cardTone(kind: string): Tone {
  switch (kind) {
    case "late_staff":
    case "breakdown":
      return "rose";
    case "customer_voice":
      return "sky";
    case "reservations":
    case "handover":
      return "violet";
    case "cash_variance":
    case "prep_time":
      return "amber";
    default:
      return "zinc";
  }
}

export function cardIconKey(kind: string): CardIconKey {
  if (
    kind === "late_staff" ||
    kind === "customer_voice" ||
    kind === "reservations" ||
    kind === "cash_variance" ||
    kind === "handover" ||
    kind === "breakdown" ||
    kind === "prep_time"
  ) {
    return kind;
  }
  return "late_staff";
}

export function cardTitleKey(titleKey: string): CardTitleKey | null {
  switch (titleKey) {
    case "brief.overdueTasks":
      return "overdueTasks";
    case "brief.reviewInbox":
      return "reviewInbox";
    case "brief.allClear":
      return "allClear";
    case "brief.cashVariance":
      return "cashVariance";
    case "brief.handover":
      return "floorHandover";
    case "brief.breakdowns":
      return "floorBreakdowns";
    case "brief.prepWaiting":
      return "prepWaiting";
    default:
      return null;
  }
}

export function sourceCopyKey(kind: string): SourceCopyKey | null {
  switch (kind) {
    case "late_staff":
      return "sourceLateStaff";
    case "customer_voice":
      return "sourceCustomerVoice";
    case "reservations":
      return "sourceReservations";
    case "cash_variance":
      return "sourceCash";
    case "handover":
      return "sourceHandover";
    case "breakdown":
      return "sourceBreakdown";
    case "daily_close":
      return "sourceDailyClose";
    case "checklist":
      return "sourceChecklist";
    case "prep_time":
      return "sourcePrep";
    default:
      return null;
  }
}

export function cardDisplayValue(card: BriefCard): { kind: "cash" | "count"; value: number } {
  if (card.kind === "cash_variance") {
    const amount = Number(card.detail);
    if (Number.isFinite(amount)) return { kind: "cash", value: amount };
  }
  return { kind: "count", value: card.count || Number(card.detail) || 0 };
}
