"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LayoutGrid, ListTodo, ShieldCheck, Sun, TimerOff, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FloorChip } from "@/components/dashboard/floor-chip";
import { TodayBriefHero } from "@/components/dashboard/today-brief-hero";
import { Button } from "@/components/ui/button";
import type { ManagerTab } from "@/domain/catalog";
import type { SessionPayload } from "@/domain/session/types";
import { filterOps, OPS_FILTERS, opsCounts, taskTone, type OpsFilter } from "@/domain/work/ops-look";
import { memberDisplayName, type TaskView } from "@/domain/work/types";
import { formatTimeRange } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { ApiError } from "@/infrastructure/http/errors";
import { TONE_GRADIENT, TONE_SOFT, TONE_WELL } from "@/theme/tones";

const FILTER_ICON = {
  all: ListTodo,
  overdue: TimerOff,
  due: Check,
} as const;

export function OpsTab({
  session,
  onOpenTab,
}: {
  session: SessionPayload;
  onOpenTab?: (tab: ManagerTab) => void;
}) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const workspaceId = session.workspace.id;
  const tasks = useQuery({
    queryKey: qk.tasks(workspaceId),
    queryFn: () => kernel.listTasks(workspaceId),
  });
  const staff = useQuery({
    queryKey: qk.staff(workspaceId),
    queryFn: () => kernel.listPersonnel(workspaceId),
  });
  const rows = tasks.data ?? [];
  const counts = opsCounts(rows);
  const personnel = (staff.data ?? []).filter((m) => m.role === "personnel" && m.isActive);
  const [filter, setFilter] = useState<OpsFilter>("all");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const visible = filterOps(rows, filter);

  const complete = useMutation({
    mutationFn: (taskId: string) => kernel.completeTask(workspaceId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tasks(workspaceId) });
      qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const assign = useMutation({
    mutationFn: ({ task, userId }: { task: TaskView; userId: string }) => {
      const start = new Date();
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return kernel.createTask(workspaceId, {
        title: t.followUpOf.replace("{title}", task.title),
        description: task.title,
        assigneeUserId: userId,
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
      });
    },
    onSuccess: () => {
      setAssigningId(null);
      qc.invalidateQueries({ queryKey: qk.tasks(workspaceId) });
      qc.invalidateQueries({ queryKey: qk.brief(workspaceId) });
    },
    onError: (err: Error) => toast.error(err instanceof ApiError ? err.message : err.message),
  });

  const busy = complete.isPending || assign.isPending;
  const summary =
    counts.overdue > 0
      ? counts.overdue === 1
        ? t.headlineOverdueOne
        : t.headlineOverdue.replace("{n}", String(counts.overdue))
      : counts.all === 0
        ? t.noTasks
        : t.opsSubtitle;

  return (
    <div className="space-y-4" data-testid="ops-board">
      <TodayBriefHero
        kicker={t.tabOps}
        summary={summary}
        detail={`${session.workspace.name} · ${counts.all} ${t.opsAll.toLowerCase()}`}
        actions={
          onOpenTab
            ? [
                { id: "today", label: t.tabToday, icon: Sun, tone: "rose", onClick: () => onOpenTab("today") },
                { id: "dashboard", label: t.tabDashboard, icon: LayoutGrid, tone: "teal", onClick: () => onOpenTab("dashboard") },
              ]
            : []
        }
      />

      <div className="grid grid-cols-3 gap-2 lg:gap-2.5" role="group" aria-label={t.tabOps} data-testid="ops-filters">
        {OPS_FILTERS.map((item) => (
          <FloorChip
            key={item.id}
            label={t[item.labelKey]}
            icon={FILTER_ICON[item.id]}
            tone={item.tone}
            active={counts[item.id] > 0}
            selected={filter === item.id}
            onClick={() => {
              if (counts[item.id] === 0 && item.id !== "all") return;
              setFilter(filter === item.id ? "all" : item.id);
            }}
            testId={`ops-filter-${item.id}`}
          />
        ))}
      </div>

      <section
        className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_50px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl"
        data-testid="ops-queue"
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100/80 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white", TONE_WELL.amber)}>
              <ListTodo className="h-4 w-4" strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">{t.tabOps}</p>
              <p className="truncate text-[12px] font-medium text-zinc-500">{t.opsEmptyHint}</p>
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-600">
            {counts.all}
          </span>
        </header>

        <div className="px-3 py-3 sm:px-4">
          {tasks.isError ? (
            <p className="px-2 py-6 text-center text-sm text-rose-700">
              {tasks.error instanceof Error ? tasks.error.message : t.opsFailed}
            </p>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center" data-testid="ops-empty">
              <span className={cn("flex h-14 w-14 items-center justify-center rounded-[20px]", TONE_GRADIENT.emerald)}>
                <ShieldCheck className="h-7 w-7" strokeWidth={2} />
              </span>
              <p className="text-[15px] font-semibold text-zinc-900">{t.noTasks}</p>
              <p className="max-w-xs text-[13px] text-zinc-500">{t.opsEmptyHint}</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {visible.map((task) => (
                <li
                  key={task.id}
                  className="rounded-[20px] px-2.5 py-2.5 transition-colors hover:bg-zinc-50/90"
                  data-testid={`ops-task-${task.id}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={cn(
                        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] shadow-[0_6px_12px_-6px_rgba(15,23,42,0.28)]",
                        TONE_GRADIENT[taskTone(task)],
                      )}
                    >
                      {task.isOverdue ? (
                        <TimerOff className="h-4 w-4" strokeWidth={2.1} />
                      ) : (
                        <ListTodo className="h-4 w-4" strokeWidth={2.1} />
                      )}
                      {task.isOverdue ? (
                        <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" aria-hidden />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold tracking-tight text-zinc-900">{task.title}</span>
                        {task.isOverdue ? (
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", TONE_SOFT.rose)}>
                            {t.overdue}
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-[12px] font-medium text-zinc-500">
                        {formatTimeRange(task.scheduledStartAt, task.scheduledEndAt, locale)}
                      </span>
                    </span>
                    {task.isOverdue ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={busy}
                          aria-label={t.assignTask}
                          onClick={() => {
                            setAssigneeUserId(personnel[0]?.userId ?? "");
                            setAssigningId(task.id);
                          }}
                        >
                          <UserPlus />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={busy}
                          aria-label={t.markDone}
                          onClick={() => complete.mutate(task.id)}
                        >
                          <Check />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {assigningId === task.id ? (
                    <form
                      className="ms-[54px] mt-2 flex items-center gap-1.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!assigneeUserId) return;
                        assign.mutate({ task, userId: assigneeUserId });
                      }}
                    >
                      <select
                        className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none"
                        value={assigneeUserId}
                        onChange={(e) => setAssigneeUserId(e.target.value)}
                        required
                        aria-label={t.assignee}
                      >
                        {personnel.length === 0 ? <option value="">{t.noStaff}</option> : null}
                        {personnel.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {memberDisplayName(m)}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="icon-sm" disabled={busy || !assigneeUserId} aria-label={t.assignTask}>
                        <Check />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setAssigningId(null)} aria-label={t.cancel}>
                        <X />
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
