"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DonutChart, type DonutSlice } from "@/components/charts/donut-chart";
import { chartGradientCss } from "@/theme/chart-colors";
import { cn } from "@/lib/utils";
import type { Tone } from "@/theme/tones";

export interface LegendRow {
  id: string;
  label: string;
  value: ReactNode;
  /** Share of the whole, shown as a quiet percent. */
  pct?: number;
  tone: Tone;
}

export function ChartCard({
  title,
  icon: Icon,
  subtitle,
  children,
  className,
  testId,
}: {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-[26px] border border-zinc-200/60 bg-white p-4 shadow-[0_10px_34px_-26px_rgba(15,23,42,0.35)] sm:p-5", className)} data-testid={testId}>
      <header className="mb-4 flex items-start gap-2.5">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden /> : null}
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold tracking-tight text-zinc-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function ChartLegend({ rows, testId }: { rows: readonly LegendRow[]; testId?: string }) {
  return (
    <ul className="min-w-0 flex-1 space-y-2" data-testid={testId}>
      {rows.map((row) => (
        <li key={row.id} className="flex items-start gap-2.5 text-[13px]">
          <span className="mt-[3px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundImage: chartGradientCss(row.tone) }} aria-hidden />
          <span className="min-w-0 flex-1 break-words leading-tight text-zinc-600">{row.label}</span>
          <span className="shrink-0 font-semibold tabular-nums text-zinc-950">{row.value}</span>
          {row.pct !== undefined ? <span className="w-9 shrink-0 text-end text-[11.5px] tabular-nums text-zinc-400">{row.pct}%</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** A titled card with a donut on one side and its legend, as readable text, on the other. */
export function DonutCard({
  title,
  icon,
  subtitle,
  slices,
  legend,
  centerValue,
  centerLabel,
  emptyText,
  hasData,
  className,
  testId,
}: {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  slices: readonly DonutSlice[];
  legend: readonly LegendRow[];
  centerValue: ReactNode;
  centerLabel?: string;
  emptyText: string;
  hasData: boolean;
  className?: string;
  testId?: string;
}) {
  return (
    <ChartCard title={title} icon={icon} subtitle={subtitle} className={className} testId={testId}>
      {hasData ? (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
          <DonutChart
            slices={slices}
            center={
              <>
                <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-zinc-950">{centerValue}</span>
                {centerLabel ? <span className="mt-1 text-[11px] font-medium text-zinc-500">{centerLabel}</span> : null}
              </>
            }
          />
          <ChartLegend rows={legend} testId={testId ? `${testId}-legend` : undefined} />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <DonutChart slices={[]} size={96} thickness={14} center={<span className="text-[18px] font-semibold text-zinc-300">—</span>} />
          <p className="text-[13px] leading-snug text-zinc-500">{emptyText}</p>
        </div>
      )}
    </ChartCard>
  );
}
