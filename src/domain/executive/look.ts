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

export type CardIconKey = "late_staff" | "customer_voice" | "reservations" | "cash_variance";

export type CardTitleKey = "overdueTasks" | "reviewInbox" | "allClear" | "cashVariance";

export type SourceCopyKey = "sourceLateStaff" | "sourceCustomerVoice" | "sourceReservations" | "sourceCash";

export function todayKpis(pulse: BriefView["pulse"]): Array<TodayKpiSpec & { value: number }> {
  return TODAY_KPIS.map((spec) => ({ ...spec, value: pulse[spec.valueKey] }));
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
      return "rose";
    case "customer_voice":
      return "sky";
    case "reservations":
      return "violet";
    case "cash_variance":
      return "amber";
    default:
      return "zinc";
  }
}

export function cardIconKey(kind: string): CardIconKey {
  if (kind === "late_staff" || kind === "customer_voice" || kind === "reservations" || kind === "cash_variance") {
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
