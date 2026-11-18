"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2 } from "lucide-react";
import { ChartCard, ChartLegend } from "@/components/charts/chart-card";
import { ConcentricRings } from "@/components/charts/concentric-rings";
import { DataTable } from "@/components/charts/data-table";
import { FreshnessPill } from "@/components/manager/portfolio/hotel-portfolio-view";
import { Skeleton } from "@/components/ui/skeleton";
import { clampPct, fractionOf } from "@/domain/charts/geometry";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

/** Today at one hotel: occupancy and readiness rings, arrivals and departures, and who is ready. */
export function HotelTodayCard({ workspaceId }: { workspaceId: string }) {
  const { t } = useLocale();
  const pms = useQuery({ queryKey: qk.hotelPMS(workspaceId), queryFn: () => kernel.getHotelPMS(workspaceId), staleTime: 15_000 });

  if (pms.isLoading) return <Skeleton className="h-64 rounded-[26px]" />;
  const view = pms.data;
  const today = view?.today;

  return (
    <ChartCard
      title={t.hotelToday}
      icon={CalendarCheck2}
      subtitle={view?.businessDate}
      testId="today-hotel"
      className="min-w-0"
    >
      {!view || !today ? (
        <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">{pms.isError ? t.dashFailed : t.hotelNoFiguresHint}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <ConcentricRings
              size={132}
              thickness={12}
              spacing={4}
              rings={[
                { id: "occupancy", pct: today.occupancyPct, tone: "indigo" },
                { id: "readiness", pct: today.readinessPct, tone: "amber" },
              ]}
            />
            <ChartLegend
              testId="today-hotel-legend"
              rows={[
                { id: "occupancy", label: t.hotelOccupancy, value: `${clampPct(today.occupancyPct)}%`, tone: "indigo" },
                { id: "readiness", label: t.dashRingReadiness, value: `${clampPct(today.readinessPct)}%`, tone: "amber" },
                { id: "arrivals", label: t.hotelArrivals, value: today.arrivalsCount, tone: "emerald" },
                { id: "departures", label: t.hotelDepartures, value: today.departuresCount, tone: "rose" },
                { id: "inhouse", label: t.hotelInHouse, value: today.inHouseGuests, tone: "sky" },
              ]}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-zinc-500">{t.hotelReadinessTitle}</p>
            <FreshnessPill freshness={view.freshness} />
          </div>
          <DataTable
            caption={t.hotelReadinessTitle}
            rows={today.readiness}
            rowKey={(row) => row.department}
            emptyText={t.dashNoChartData}
            columns={[
              { key: "dept", header: t.department, render: (row) => row.department },
              { key: "done", header: t.done, align: "end", render: (row) => `${row.completed}/${row.total}` },
              {
                key: "pct",
                header: "%",
                align: "end",
                render: (row) => `${clampPct(fractionOf(row.completed, row.total) * 100)}%`,
              },
            ]}
          />
        </div>
      )}
    </ChartCard>
  );
}
