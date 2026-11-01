"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ListTodo, TimerOff, Users } from "lucide-react";
import type { ManagerTab } from "@/domain/catalog";
import { SoftPulseKpi, WhiteCard } from "@/components/manager/white-card";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { isOpenTask } from "@/domain/work/types";
import { useLocale } from "@/providers/locale-provider";

export function OverviewTab({
  workspaceId,
  onOpenTab,
}: {
  workspaceId: string;
  onOpenTab: (tab: ManagerTab) => void;
}) {
  const { t } = useLocale();
  const staff = useQuery({ queryKey: qk.staff(workspaceId), queryFn: () => kernel.listPersonnel(workspaceId) });
  const tasks = useQuery({ queryKey: qk.tasks(workspaceId), queryFn: () => kernel.listTasks(workspaceId) });
  const routines = useQuery({ queryKey: qk.routines(workspaceId), queryFn: () => kernel.listRoutines(workspaceId) });
  const list = tasks.data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-[26px] text-zinc-900 sm:text-2xl">{t.tabOverview}</h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <button type="button" onClick={() => onOpenTab("team")}>
          <SoftPulseKpi label={t.tabTeam} value={staff.data?.length ?? 0} tone="sky" icon={Users} />
        </button>
        <button type="button" onClick={() => onOpenTab("tasks_detail")}>
          <SoftPulseKpi label={t.open} value={list.filter(isOpenTask).length} tone="amber" icon={ListTodo} />
        </button>
        <SoftPulseKpi label={t.overdue} value={list.filter((task) => task.isOverdue).length} tone="rose" icon={TimerOff} />
        <button type="button" onClick={() => onOpenTab("routines")}>
          <SoftPulseKpi label={t.tabRoutines} value={routines.data?.length ?? 0} tone="emerald" icon={CalendarClock} />
        </button>
      </div>
      <WhiteCard>
        <p className="text-sm text-zinc-900/50">Department cockpit — tiles jump to staff, tasks and routines.</p>
      </WhiteCard>
    </div>
  );
}
