"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, BedDouble, Building2, CalendarDays, ClipboardEdit, Info, PlugZap, Wallet } from "lucide-react";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { HotelDailyForm } from "@/components/manager/portfolio/hotel-daily-form";
import { HotelOhipPanel } from "@/components/manager/portfolio/hotel-ohip-panel";
import { HotelProfileForm } from "@/components/manager/portfolio/hotel-profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorMoney, type HotelFreshness, type HotelPMSView } from "@/domain/hotel/pms";
import type { HotelCard, HotelsSummary } from "@/domain/portfolio/types";
import type { Messages } from "@/lib/i18n";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export const FRESHNESS_STYLE: Record<HotelFreshness, { cls: string; key: keyof Messages }> = {
  current: { cls: "bg-emerald-50 text-emerald-700", key: "hotelFreshCurrent" },
  delayed: { cls: "bg-amber-50 text-amber-800", key: "hotelFreshDelayed" },
  stale: { cls: "bg-rose-50 text-rose-700", key: "hotelFreshStale" },
  unavailable: { cls: "bg-zinc-100 text-zinc-600", key: "hotelFreshUnavailable" },
};

export function hotelSummaryLine(h: HotelCard, t: Messages, locale: string): string {
  if (h.occupancyPct === undefined || !h.currency) return t.hotelNoFiguresToday;
  const parts = [`${t.hotelOccupancy} ${h.occupancyPct}%`, formatMinorMoney(h.totalRevenueMinor, h.currency, locale)];
  if (h.hasYesterday && h.revenueDeltaPct !== undefined) {
    parts.push(`${h.revenueDeltaPct >= 0 ? "+" : ""}${h.revenueDeltaPct}% ${t.hotelVsYesterday}`);
  }
  return parts.join(" · ");
}

function hotelsLine(hotels: HotelsSummary, t: Messages, locale: string): string {
  const parts: string[] = hotels.totalsByCurrency.map((tot) => formatMinorMoney(tot.todayTotalRevenueMinor, tot.currency, locale));
  if (hotels.avgOccupancyPct !== undefined) parts.push(`${t.hotelOccupancy} ${hotels.avgOccupancyPct}%`);
  if (parts.length === 0) return t.hotelNoFiguresToday;
  parts.push(`${hotels.totalArrivals}/${hotels.totalDepartures} ${t.hotelArrivals}/${t.hotelDepartures}`);
  return parts.join(" · ");
}

export function FreshnessPill({ freshness }: { freshness: HotelFreshness }) {
  const { t } = useLocale();
  const meta = FRESHNESS_STYLE[freshness];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", meta.cls)}>{t[meta.key]}</span>;
}

export function HotelPortfolioView({ hotels, selectedHotelId }: { hotels: HotelsSummary; selectedHotelId: string | null }) {
  const { t, locale } = useLocale();

  if (hotels.hotels.length === 0) {
    return (
      <section className="rounded-[26px] border border-zinc-200/60 bg-white p-5 text-[13.5px] text-zinc-500">{t.hotelNotWired}</section>
    );
  }

  const openId = selectedHotelId && hotels.hotels.some((h) => h.workspaceId === selectedHotelId) ? selectedHotelId : hotels.hotels[0]?.workspaceId;

  return (
    <div className="space-y-3" data-testid="portfolio-hotel-view">
      <p className="px-1 text-[13px] font-medium text-zinc-500" data-testid="hotels-combined-card">
        {hotelsLine(hotels, t, locale)}
      </p>

      {hotels.hotels.map((h) => (
        <CollapsibleSection
          key={h.workspaceId}
          persistId={`hotel:${h.workspaceId}`}
          defaultOpen={h.workspaceId === openId}
          title={h.name}
          icon={Building2}
          tone={h.freshness === "unavailable" ? "zinc" : "indigo"}
          summary={hotelSummaryLine(h, t, locale)}
          badge={<FreshnessPill freshness={h.freshness} />}
          testId={`hotel-section-${h.slug}`}
        >
          <HotelDetail workspaceId={h.workspaceId} />
        </CollapsibleSection>
      ))}
    </div>
  );
}

function HotelDetail({ workspaceId }: { workspaceId: string }) {
  const { t, locale } = useLocale();
  const pms = useQuery({
    queryKey: qk.hotelPMS(workspaceId),
    queryFn: () => kernel.getHotelPMS(workspaceId),
    staleTime: 15_000,
  });

  if (pms.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[20px]" />
        ))}
      </div>
    );
  }
  if (pms.isError || !pms.data) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
        {pms.error instanceof Error ? pms.error.message : t.dashFailed}
        <button type="button" className="ms-2 font-semibold underline" onClick={() => void pms.refetch()}>
          {t.dashRetry}
        </button>
      </div>
    );
  }

  const view = pms.data;
  const today = view.today;
  const comp = view.comparison;

  return (
    <div className="space-y-3">
      {today ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricTile icon={BedDouble} tone="indigo" value={`${today.occupancyPct}%`} label={`${today.occupiedRooms}/${today.availableRooms} ${t.hotelRooms}`} compact />
            <MetricTile icon={Wallet} tone="sky" value={formatMinorMoney(today.totalRevenueMinor, today.currency, locale)} label={t.hotelRevenue} compact />
            <MetricTile icon={Building2} tone="teal" value={formatMinorMoney(today.adrMinor, today.currency, locale)} label={t.hotelAdr} compact />
            <MetricTile icon={CalendarDays} tone="violet" value={formatMinorMoney(today.revparMinor, today.currency, locale)} label={t.hotelRevpar} compact />
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-zinc-600">
            <span>
              {t.hotelArrivals} <strong className="tabular-nums text-zinc-900">{today.arrivalsCount}</strong>
            </span>
            <span>
              {t.hotelDepartures} <strong className="tabular-nums text-zinc-900">{today.departuresCount}</strong>
            </span>
            <span>
              {t.hotelOoo} <strong className="tabular-nums text-zinc-900">{today.outOfOrderRooms}</strong>
            </span>
            {comp?.hasYesterday ? (
              <span className={cn("inline-flex items-center gap-1 font-semibold tabular-nums", comp.revenueDeltaMinor >= 0 ? "text-emerald-700" : "text-rose-700")}>
                {comp.revenueDeltaMinor >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {formatMinorMoney(Math.abs(comp.revenueDeltaMinor), today.currency, locale)}
                {comp.revenueDeltaPct !== undefined ? ` (${comp.revenueDeltaPct >= 0 ? "+" : ""}${comp.revenueDeltaPct}%)` : ""} {t.hotelVsYesterday}
              </span>
            ) : null}
            <span className="text-zinc-400">
              {t.hotelSource}: {sourceLabel(today.source, t)}
            </span>
          </p>
          {today.reservations.length > 0 ? (
            <ul className="space-y-1.5" aria-label={t.hotelReservations}>
              {today.reservations.slice(0, 5).map((res) => (
                <li key={res.confirmationNo + res.guestName} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50/85 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-zinc-900">
                      {res.guestName || res.confirmationNo} {res.vip ? "· VIP" : ""}
                    </p>
                    <p className="truncate text-[11.5px] text-zinc-500">
                      {res.roomType} · {res.arrivalDate} → {res.departureDate}
                    </p>
                  </div>
                  <p className="shrink-0 text-[12.5px] font-semibold tabular-nums text-zinc-900">{formatMinorMoney(res.rateMinor, res.currency, locale)}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[13px] text-zinc-600">{t.hotelNoFiguresHint}</p>
      )}

      <HotelManageSections workspaceId={workspaceId} view={view} />
    </div>
  );
}

/** Hotel info, daily figures and OHIP, each in its own collapsible so the dashboard stays short. */
export function HotelManageSections({ workspaceId, view }: { workspaceId: string; view: HotelPMSView }) {
  const { t } = useLocale();
  const today = view.today;
  return (
      <div className="space-y-2">
        <CollapsibleSection
          variant="inset"
          persistId={`hotel:${workspaceId}:info`}
          title={t.hotelInfoTitle}
          icon={Info}
          tone="sky"
          summary={[view.profile.totalRooms ? `${view.profile.totalRooms} ${t.hotelRooms}` : null, view.profile.currency, view.profile.city || null]
            .filter(Boolean)
            .join(" · ")}
          testId="hotel-info-section"
        >
          <HotelProfileForm key={`${workspaceId}:${view.profile.updatedAt ?? "seed"}`} workspaceId={workspaceId} profile={view.profile} />
        </CollapsibleSection>

        {view.canRecord ? (
          <CollapsibleSection
            variant="inset"
            persistId={`hotel:${workspaceId}:daily`}
            title={t.hotelDailyTitle}
            icon={ClipboardEdit}
            tone="amber"
            summary={today ? `${t.hotelDailyEntered} · ${sourceLabel(today.source, t)}` : t.hotelDailyMissing}
            testId="hotel-daily-section"
          >
            <HotelDailyForm key={`${workspaceId}:${view.businessDate}:${today?.capturedAt ?? "none"}`} view={view} />
          </CollapsibleSection>
        ) : null}

        <CollapsibleSection
          variant="inset"
          persistId={`hotel:${workspaceId}:ohip`}
          title={t.ohipTitle}
          icon={PlugZap}
          tone={view.connector.configured ? "teal" : "zinc"}
          summary={view.connector.configured ? (view.connector.syncMode === "ohip_api" ? t.ohipModeApi : t.ohipModeExport) : t.hotelFreshUnavailable}
          testId="hotel-ohip-section"
        >
          <HotelOhipPanel key={`${workspaceId}:${view.connector.lastSyncAt ?? "never"}`} view={view} />
        </CollapsibleSection>
      </div>
  );
}

export function sourceLabel(source: string, t: Messages): string {
  if (source === "ohip_live") return t.ohipModeApi;
  if (source === "opera_export") return t.ohipModeExport;
  return t.hotelSourceManual;
}
