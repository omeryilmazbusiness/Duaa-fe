"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LayoutGrid, ListTodo, ShieldCheck, Sun, TimerOff, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardCommandBar } from "@/components/dashboard/command-bar";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { WidgetCard } from "@/components/dashboard/widget-card";
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
import { TONE_GRADIENT, TONE_SOFT } from "@/theme/tones";

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

  return (
    <div className="space-y-5" data-testid="ops-board">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">{t.tabOps}</h1>
        <p className="max-w-2xl text-sm font-medium text-zinc-500">{t.opsSubtitle}</p>
      </header>

      {onOpenTab ? (
        <DashboardCommandBar
          title={t.tabOps}
          hint={`${session.workspace.name} · ${counts.overdue} ${t.overdue}`}
          actions={[
            { id: "today", label: t.tabToday, icon: Sun, tone: "rose", onClick: () => onOpenTab("today") },
            { id: "dashboard", label: t.tabDashboard, icon: LayoutGrid, tone: "teal", onClick: () => onOpenTab("dashboard") },
          ]}
        />
      ) : null}

      <WidgetCard title={t.tabOps} icon={ListTodo} tone="amber" count={counts.all} testId="ops-queue">
        <div className="mb-4 grid grid-cols-3 gap-2" role="group" aria-label={t.tabOps}>
          {OPS_FILTERS.map((item) => (
            <MetricTile
              key={item.id}
              icon={FILTER_ICON[item.id]}
              tone={item.tone}
              value={counts[item.id]}
              label={t[item.labelKey]}
              active={filter === item.id}
              disabled={counts[item.id] === 0}
              alert={item.id === "overdue" && counts.overdue > 0}
              onClick={() => setFilter(filter === item.id ? "all" : item.id)}
              testId={`ops-filter-${item.id}`}
            />
          ))}
        </div>

        {tasks.isError ? (
          <p className="text-sm text-rose-700">{tasks.error instanceof Error ? tasks.error.message : t.opsFailed}</p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center" data-testid="ops-empty">
            <span className={cn("flex h-14 w-14 items-center justify-center rounded-[20px]", TONE_GRADIENT.emerald)}>
              <ShieldCheck className="h-7 w-7" strokeWidth={2} />
            </span>
            <p className="text-[15px] font-semibold text-zinc-900">{t.noTasks}</p>
            <p className="text-[13px] text-zinc-500">{t.opsEmptyHint}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {visible.map((task) => (
              <li key={task.id} className="rounded-[20px] px-2.5 py-2.5 hover:bg-zinc-50/90" data-testid={`ops-task-${task.id}`}>
                <div className="flex items-center gap-3.5">
                  <span className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_6px_12px_-6px_rgba(15,23,42,0.28)]", TONE_GRADIENT[taskTone(task)])}>
                    {task.isOverdue ? <TimerOff className="h-5 w-5" strokeWidth={2.1} /> : <ListTodo className="h-5 w-5" strokeWidth={2.1} />}
                    {task.isOverdue ? <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" aria-hidden /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold tracking-tight text-zinc-900">{task.title}</span>
                      {task.isOverdue ? <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", TONE_SOFT.rose)}>{t.overdue}</span> : null}
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
                      <Button type="button" variant="ghost" size="icon-sm" disabled={busy} aria-label={t.markDone} onClick={() => complete.mutate(task.id)}>
                        <Check />
                      </Button>
                    </div>
                  ) : null}
                </div>
                {assigningId === task.id ? (
                  <form
                    className="ms-[58px] mt-2 flex items-center gap-1.5"
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
      </WidgetCard>
    </div>
  );
}
