"use client";

import { useQuery } from "@tanstack/react-query";
import { BedDouble, CalendarCheck2, CalendarDays, DoorClosed, DoorOpen, PlugZap } from "lucide-react";
import { ChartCard } from "@/components/charts/chart-card";
import { DataTable } from "@/components/charts/data-table";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { StatTile } from "@/components/dashboard/stat-tile";
import { HotelOhipPanel } from "@/components/manager/portfolio/hotel-ohip-panel";
import { FreshnessPill } from "@/components/manager/portfolio/hotel-portfolio-view";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorMoney, type ReservationStatus } from "@/domain/hotel/pms";
import type { SessionPayload } from "@/domain/session/types";
import type { Messages } from "@/lib/i18n";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

const STATUS_LABEL: Record<ReservationStatus, keyof Messages> = {
  reserved: "resStatusReserved",
  checked_in: "resStatusCheckedIn",
  checked_out: "resStatusCheckedOut",
  cancelled: "resStatusCancelled",
  no_show: "resStatusNoShow",
};

const STATUS_STYLE: Record<ReservationStatus, string> = {
  reserved: "bg-sky-50 text-sky-700",
  checked_in: "bg-emerald-50 text-emerald-700",
  checked_out: "bg-zinc-100 text-zinc-600",
  cancelled: "bg-rose-50 text-rose-700",
  no_show: "bg-amber-50 text-amber-800",
};

/** The selected hotel's reservations and the OHIP / OPERA feed that fills them. */
export function ReservationsTab({ session }: { session: SessionPayload }) {
  const { t, locale } = useLocale();
  const wid = session.workspace.id;
  const pms = useQuery({ queryKey: qk.hotelPMS(wid), queryFn: () => kernel.getHotelPMS(wid), staleTime: 15_000 });

  if (pms.isLoading) {
    return (
      <div className="space-y-3" data-testid="reservations-loading">
        <Skeleton className="h-24 rounded-[22px]" />
        <Skeleton className="h-56 rounded-[26px]" />
      </div>
    );
  }
  if (pms.isError || !pms.data) {
    return (
      <section className="rounded-[26px] border border-rose-100 bg-white px-5 py-5" data-testid="reservations-error">
        <p className="text-sm text-rose-700">{pms.error instanceof Error ? pms.error.message : t.dashFailed}</p>
        <button type="button" className="mt-3 text-sm font-semibold text-[#007AFF]" onClick={() => void pms.refetch()}>
          {t.dashRetry}
        </button>
      </section>
    );
  }

  const view = pms.data;
  const today = view.today;
  const rows = today?.reservations ?? [];

  return (
    <div className="space-y-3" data-testid="reservations-board" data-workspace={wid}>
      <header className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{t.tabReservations}</p>
          <h2 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-zinc-950">{session.workspace.name}</h2>
        </div>
        <FreshnessPill freshness={view.freshness} />
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:gap-3" data-testid="reservations-kpis">
        <StatTile compact label={t.hotelArrivals} value={today?.arrivalsCount ?? "—"} tone="emerald" icon={DoorOpen} />
        <StatTile compact label={t.hotelDepartures} value={today?.departuresCount ?? "—"} tone="amber" icon={DoorClosed} />
        <StatTile compact label={t.hotelInHouse} value={today?.inHouseGuests ?? "—"} tone="indigo" icon={BedDouble} />
        <StatTile compact label={t.hotelReservations} value={today?.reservationsCount ?? "—"} tone="sky" icon={CalendarCheck2} />
      </div>

      <ChartCard title={t.hotelReservations} icon={CalendarDays} subtitle={view.businessDate} testId="table-reservations">
        <DataTable
          caption={t.hotelReservations}
          rows={rows}
          rowKey={(r) => `${r.confirmationNo}:${r.guestName}:${r.arrivalDate}`}
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
            { key: "nights", header: t.dashColNights, align: "end", render: (r) => r.nights },
            {
              key: "status",
              header: t.dashColStatus,
              render: (r) => (
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLE[r.status])}>{t[STATUS_LABEL[r.status]]}</span>
              ),
            },
            { key: "channel", header: t.dashColChannel, render: (r) => r.channel || "—" },
            { key: "rate", header: t.dashColRate, align: "end", render: (r) => formatMinorMoney(r.rateMinor, r.currency, locale) },
          ]}
        />
      </ChartCard>

      <CollapsibleSection
        persistId={`hotel:${wid}:ohip`}
        title={t.ohipTitle}
        icon={PlugZap}
        tone={view.connector.configured ? "teal" : "zinc"}
        summary={view.connector.configured ? (view.connector.syncMode === "ohip_api" ? t.ohipModeApi : t.ohipModeExport) : t.hotelFreshUnavailable}
        testId="reservations-ohip"
      >
        <HotelOhipPanel key={`${wid}:${view.connector.lastSyncAt ?? "never"}`} view={view} />
      </CollapsibleSection>
    </div>
  );
}
