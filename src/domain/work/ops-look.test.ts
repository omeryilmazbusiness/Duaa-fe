import { describe, expect, it } from "vitest";
import { filterOps, isOpsFilter, OPS_FILTERS, opsCounts, taskTone } from "./ops-look";
import type { TaskView } from "./types";

function task(over: Partial<TaskView> & Pick<TaskView, "id" | "isOverdue" | "status">): TaskView {
  return {
    title: over.title ?? over.id,
    description: "",
    assigneeUserId: "u1",
    scheduledStartAt: "2026-11-01T08:00:00Z",
    scheduledEndAt: "2026-11-01T10:00:00Z",
    completedAt: null,
    ...over,
  };
}

describe("ops look", () => {
  it("counts open work and drops completed or cancelled jobs", () => {
    const tasks = [
      task({ id: "late", isOverdue: true, status: "pending" }),
      task({ id: "due", isOverdue: false, status: "in_progress" }),
      task({ id: "done", isOverdue: true, status: "completed" }),
      task({ id: "gone", isOverdue: false, status: "cancelled" }),
    ];
    expect(opsCounts(tasks)).toEqual({ all: 2, overdue: 1, due: 1 });
    expect(filterOps(tasks, "overdue").map((item) => item.id)).toEqual(["late"]);
    expect(filterOps(tasks, "due").map((item) => item.id)).toEqual(["due"]);
    expect(taskTone(tasks[0]!)).toBe("rose");
    expect(taskTone(tasks[1]!)).toBe("amber");
  });

  it("exposes three Wodi filter chips", () => {
    expect(OPS_FILTERS.map((item) => item.id)).toEqual(["all", "overdue", "due"]);
    expect(isOpsFilter("overdue")).toBe(true);
    expect(isOpsFilter("wallet")).toBe(false);
  });
});
