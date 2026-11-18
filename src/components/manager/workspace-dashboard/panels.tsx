"use client";

import { Activity, CheckCircle2, CircleDashed, ListTodo, Users } from "lucide-react";
import type { ReactNode } from "react";
import { ChartCard, ChartLegend, DonutCard, type LegendRow } from "@/components/charts/chart-card";
import { ConcentricRings, type RingSpec } from "@/components/charts/concentric-rings";
import { DataTable } from "@/components/charts/data-table";
import { CHANNEL_LABEL } from "@/components/manager/portfolio/completeness-card";
import { clampPct } from "@/domain/charts/geometry";
import { hasChartData, segmentPct, segmentTotal, taskSegments, type ChartSegment } from "@/domain/dashboard/charts";
import type { DashboardPulse, WorkloadRow } from "@/domain/dashboard/types";
import type { WorkspaceCompleteness } from "@/domain/portfolio/types";
import { departmentLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

/** Legend rows for a set of slices: the label, the figure and its share. */
export function useLegend(segments: readonly ChartSegment[], format: (value: number) => ReactNode = (v) => v): LegendRow[] {
  const { t } = useLocale();
  return segments.map((s) => ({ id: s.id, label: t[s.labelKey], value: format(s.value), pct: segmentPct(s, segments), tone: s.tone }));
}

export function TasksDonut({ pulse }: { pulse: DashboardPulse | undefined }) {
  const { t } = useLocale();
  const segments = taskSegments(pulse ?? { openTasks: 0, overdueTasks: 0, completedToday: 0 });
  const legend = useLegend(segments);
  return (
    <DonutCard
      title={t.dashChartTasks}
      icon={ListTodo}
      slices={segments}
      legend={legend}
      centerValue={segmentTotal(segments)}
      centerLabel={t.dashTotal}
      emptyText={t.dashNoChartData}
      hasData={hasChartData(segments)}
      testId="chart-tasks"
    />
  );
}

export interface HealthRing extends RingSpec {
  label: string;
  /** Text shown beside the ring; "—" when the source has not reported. */
  value: string;
  available: boolean;
}

/** Three nested rings with their legend: the first number a manager checks. */
export function HealthRings({ title, rings }: { title: string; rings: readonly HealthRing[] }) {
  const live = rings.filter((r) => r.available);
  return (
    <ChartCard title={title} icon={Activity} testId="chart-health">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
        <ConcentricRings rings={live} size={164} thickness={13} spacing={4} />
        <ChartLegend rows={rings.map((r) => ({ id: r.id, label: r.label, value: r.value, tone: r.tone }))} testId="chart-health-legend" />
      </div>
    </ChartCard>
  );
}

export function ringPct(pct: number | undefined): { pct: number; available: boolean; value: string } {
  if (pct === undefined || !Number.isFinite(pct)) return { pct: 0, available: false, value: "—" };
  const clean = clampPct(pct);
  return { pct: clean, available: true, value: `${clean}%` };
}

export function ChannelsTable({ entry }: { entry: WorkspaceCompleteness | undefined }) {
  const { t } = useLocale();
  const channels = entry?.channels ?? [];
  return (
    <ChartCard
      title={t.dashTableChannels}
      icon={CheckCircle2}
      subtitle={entry ? t.completenessFeeds.replace("{entered}", String(entry.enteredCount)).replace("{expected}", String(entry.expectedCount)) : undefined}
      testId="table-channels"
    >
      <DataTable
        caption={t.dashTableChannels}
        rows={channels}
        rowKey={(ch) => ch.key}
        emptyText={t.dashNoChartData}
        columns={[
          { key: "channel", header: t.dashColChannel, render: (ch) => {
              const key = CHANNEL_LABEL[ch.key];
              return key ? t[key] : ch.key;
            },
          },
          {
            key: "status",
            header: t.dashColStatus,
            align: "end",
            render: (ch) => (
              <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", ch.entered ? "text-emerald-700" : "text-zinc-500")}>
                {ch.entered ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <CircleDashed className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
                {ch.entered ? t.dashChannelEntered : t.dashChannelMissing}
              </span>
            ),
          },
        ]}
      />
    </ChartCard>
  );
}

export function WorkloadTable({ workload }: { workload: readonly WorkloadRow[] }) {
  const { t } = useLocale();
  return (
    <ChartCard title={t.teamSectionTitle} icon={Users} testId="table-workload">
      <DataTable
        caption={t.teamSectionTitle}
        rows={workload}
        rowKey={(row) => row.userId}
        emptyText={t.noWorkload}
        columns={[
          { key: "name", header: t.dashColName, render: (row) => <span className="font-medium text-zinc-900">{row.name}</span> },
          { key: "dept", header: t.department, render: (row) => (row.department ? departmentLabel(row.department) : "—") },
          { key: "open", header: t.open, align: "end", render: (row) => row.openTasks },
          {
            key: "overdue",
            header: t.overdue,
            align: "end",
            render: (row) => <span className={row.overdueTasks > 0 ? "font-semibold text-rose-600" : "text-zinc-400"}>{row.overdueTasks}</span>,
          },
        ]}
      />
    </ChartCard>
  );
}
