"use client";

import { useQuery } from "@tanstack/react-query";
import { BedDouble, CalendarDays, Wallet } from "lucide-react";
import { ChartCard, DonutCard } from "@/components/charts/chart-card";
import { DataTable } from "@/components/charts/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelsTable, HealthRings, ringPct, TasksDonut, useLegend } from "@/components/manager/workspace-dashboard/panels";
import { HotelManageSections } from "@/components/manager/portfolio/hotel-portfolio-view";
import { hasChartData, occupancySegments, revenueMixSegments, segmentTotal } from "@/domain/dashboard/charts";
import type { DashboardPulse } from "@/domain/dashboard/types";
import { formatMinorMoney, minorToMajor } from "@/domain/hotel/pms";
import type { HotelCard, WorkspaceCompleteness } from "@/domain/portfolio/types";
import { formatCompact } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

/** One hotel's own dashboard: rings and donuts first, then the tables behind them. */
export function HotelDashboard({
  workspaceId,
  hotel,
  completeness,
  pulse,
}: {
  workspaceId: string;
  hotel: HotelCard | undefined;
  completeness: WorkspaceCompleteness | undefined;
  pulse: DashboardPulse | undefined;
}) {
  const { t, locale } = useLocale();
  const pms = useQuery({ queryKey: qk.hotelPMS(workspaceId), queryFn: () => kernel.getHotelPMS(workspaceId), staleTime: 15_000 });

  const currency = hotel?.currency ?? pms.data?.today?.currency ?? "";
  const money = (minor: number) => (currency ? formatMinorMoney(minor, currency, locale) : "—");
  const hasFigures = !!hotel && hotel.occupancyPct !== undefined;

  const occupancy = occupancySegments(hotel ?? { occupiedRooms: 0, availableRooms: 0, outOfOrderRooms: 0 });
  const revenue = revenueMixSegments(hotel ?? { roomRevenueMinor: 0, fbRevenueMinor: 0, otherRevenueMinor: 0 });
  const occupancyLegend = useLegend(occupancy);
  const revenueLegend = useLegend(revenue, (v) => (currency ? minorToMajor(v, currency).toLocaleString(locale, { maximumFractionDigits: 0 }) : "—"));

  const occ = ringPct(hasFigures ? hotel?.occupancyPct : undefined);
  const ready = ringPct(hasFigures ? hotel?.readinessPct : undefined);
  const data = ringPct(completeness?.pct ?? hotel?.completenessPct);

  const reservations = pms.data?.today?.reservations ?? [];
  const today = pms.data?.today;

  return (
    <div className="space-y-3" data-testid="dashboard-hotel">
      <div className="grid gap-3 md:grid-cols-2">
        <HealthRings
          title={t.dashChartHealth}
          rings={[
            { id: "occupancy", label: t.hotelOccupancy, tone: "indigo", ...occ },
            { id: "readiness", label: t.dashRingReadiness, tone: "amber", ...ready },
            { id: "completeness", label: t.completenessTitle, tone: "emerald", ...data },
          ]}
        />
        <DonutCard
          title={t.dashChartOccupancy}
          icon={BedDouble}
          slices={occupancy}
          legend={occupancyLegend}
          centerValue={hasFigures ? `${hotel?.occupancyPct}%` : "—"}
          centerLabel={hotel ? `${hotel.occupiedRooms}/${hotel.availableRooms} ${t.hotelRooms}` : undefined}
          emptyText={t.hotelNoFiguresHint}
          hasData={hasFigures && hasChartData(occupancy)}
          testId="chart-occupancy"
        />
        <DonutCard
          title={t.dashChartRevenue}
          subtitle={currency || undefined}
          icon={Wallet}
          slices={revenue}
          legend={revenueLegend}
          centerValue={currency ? formatCompact(minorToMajor(segmentTotal(revenue), currency), locale) : "—"}
          centerLabel={currency || undefined}
          emptyText={t.hotelNoFiguresHint}
          hasData={hasChartData(revenue)}
          testId="chart-revenue"
        />
        <TasksDonut pulse={pulse} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ChartCard title={t.dashTableDaily} icon={CalendarDays} subtitle={hotel?.businessDate} testId="table-daily">
          {hasFigures && hotel ? (
            <DataTable
              caption={t.dashTableDaily}
              rows={[
                { id: "rooms", label: t.dashSegRooms, value: money(hotel.roomRevenueMinor) },
                { id: "fb", label: t.dashSegFb, value: money(hotel.fbRevenueMinor) },
                { id: "other", label: t.dashSegOther, value: money(hotel.otherRevenueMinor) },
                { id: "total", label: t.hotelRevenue, value: money(hotel.totalRevenueMinor) },
                { id: "adr", label: t.hotelAdr, value: money(hotel.adrMinor) },
                { id: "revpar", label: t.hotelRevpar, value: money(hotel.revparMinor) },
                { id: "arrivals", label: t.hotelArrivals, value: String(hotel.arrivalsCount) },
                { id: "departures", label: t.hotelDepartures, value: String(hotel.departuresCount) },
              ]}
              rowKey={(row) => row.id}
              emptyText={t.hotelNoFiguresHint}
              columns={[
                { key: "metric", header: t.dashColMetric, render: (row) => <span className={row.id === "total" ? "font-semibold text-zinc-950" : undefined}>{row.label}</span> },
                { key: "value", header: t.dashColValue, align: "end", render: (row) => <span className={row.id === "total" ? "font-semibold text-zinc-950" : undefined}>{row.value}</span> },
              ]}
            />
          ) : (
            <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">{t.hotelNoFiguresHint}</p>
          )}
        </ChartCard>
        <ChannelsTable entry={completeness} />
      </div>

      <ChartCard title={t.hotelReservations} icon={CalendarDays} testId="table-reservations">
        {pms.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <DataTable
            caption={t.hotelReservations}
            rows={reservations.slice(0, 8)}
            rowKey={(r) => `${r.confirmationNo}:${r.guestName}`}
            emptyText={today ? t.dashNoChartData : t.hotelNoFiguresHint}
            columns={[
              {
                key: "guest",
                header: t.dashColGuest,
                render: (r) => (
                  <span className="font-medium text-zinc-900">
                    {r.guestName || r.confirmationNo}
                    {r.vip ? <span className="ms-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">VIP</span> : null}
                  </span>
                ),
              },
              { key: "room", header: t.dashColRoomType, render: (r) => r.roomType || "—" },
              { key: "stay", header: t.dashColStay, render: (r) => `${r.arrivalDate} → ${r.departureDate}` },
              { key: "rate", header: t.dashColRate, align: "end", render: (r) => formatMinorMoney(r.rateMinor, r.currency, locale) },
            ]}
          />
        )}
      </ChartCard>

      {pms.data ? <HotelManageSections workspaceId={workspaceId} view={pms.data} /> : null}
    </div>
  );
}
