import type { Tone } from "@/theme/tones";
import { isOpenTask, type TaskView } from "./types";

export type OpsFilter = "all" | "overdue" | "due";

export interface OpsFilterSpec {
  id: OpsFilter;
  tone: Tone;
  labelKey: "opsAll" | "overdue" | "open";
}

export const OPS_FILTERS: readonly OpsFilterSpec[] = [
  { id: "all", tone: "sky", labelKey: "opsAll" },
  { id: "overdue", tone: "rose", labelKey: "overdue" },
  { id: "due", tone: "amber", labelKey: "open" },
];

export function openTasks(tasks: readonly TaskView[]): TaskView[] {
  return tasks.filter(isOpenTask);
}

export function partitionOps(tasks: readonly TaskView[]): { all: TaskView[]; overdue: TaskView[]; due: TaskView[] } {
  const all = openTasks(tasks);
  return {
    all,
    overdue: all.filter((task) => task.isOverdue),
    due: all.filter((task) => !task.isOverdue),
  };
}

export function opsCounts(tasks: readonly TaskView[]): Record<OpsFilter, number> {
  const parts = partitionOps(tasks);
  return { all: parts.all.length, overdue: parts.overdue.length, due: parts.due.length };
}

export function filterOps(tasks: readonly TaskView[], filter: OpsFilter): TaskView[] {
  return partitionOps(tasks)[filter];
}

export function taskTone(task: Pick<TaskView, "isOverdue">): Tone {
  return task.isOverdue ? "rose" : "amber";
}

export function isOpsFilter(value: string): value is OpsFilter {
  return value === "all" || value === "overdue" || value === "due";
}
