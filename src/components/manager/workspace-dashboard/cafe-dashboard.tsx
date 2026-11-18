"use client";

import { useQuery } from "@tanstack/react-query";
import { ChefHat, Package, Receipt, Trash2, Wallet } from "lucide-react";
import { ChartCard, DonutCard } from "@/components/charts/chart-card";
import { DataTable } from "@/components/charts/data-table";
import { CafeManageSections } from "@/components/manager/portfolio/cafe-manage";
import { ChannelsTable, HealthRings, ringPct, TasksDonut, useLegend } from "@/components/manager/workspace-dashboard/panels";
import {
  checklistSegments,
  hasChartData,
  prepSegments,
  salesMixSegments,
  segmentTotal,
  stockSegments,
  wasteSegments,
} from "@/domain/dashboard/charts";
import type { DashboardView } from "@/domain/dashboard/types";
import type { CafeCard, WorkspaceCompleteness } from "@/domain/portfolio/types";
import { formatCompact, formatIQD } from "@/lib/format";
import { kernel } from "@/lib/kernel";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/providers/locale-provider";

const NO_PREP = { waitingPrep: 0, readyPrep: 0, servedPrep: 0, openChecks: 0, openDone: 0, closeChecks: 0, closeDone: 0 };

/** One cafe's own dashboard: sales, stock, prep and waste as rings, then the tables behind them. */
export function CafeDashboard({
  workspaceId,
  cafe,
  completeness,
  dash,
  seeMoney,
  canClose,
  canRecordPOS,
}: {
  workspaceId: string;
  cafe: CafeCard | undefined;
  completeness: WorkspaceCompleteness | undefined;
  dash: DashboardView | undefined;
  seeMoney: boolean;
  canClose: boolean;
  canRecordPOS: boolean;
}) {
  const { t, locale } = useLocale();
  const brief = useQuery({ queryKey: qk.brief(workspaceId), queryFn: () => kernel.getBrief(workspaceId), staleTime: 15_000 });
  const floor = brief.data?.pulse ?? NO_PREP;

  const sales = dash?.sales;
  const salesLive = sales?.status === "live";
  const waste = dash?.waste;
  const wasteLive = waste?.status === "live";
  const stockLive = cafe?.stockStatus === "live" && (cafe?.stockItems ?? 0) > 0;

  const salesMix = salesMixSegments(salesLive && sales ? sales : { cash: 0, card: 0, other: 0 });
  const stock = stockSegments(stockLive && cafe ? cafe : { stockItems: 0, stockLowCount: 0 });
  const prep = prepSegments(floor);
  const wasteMix = wasteSegments(wasteLive && waste ? waste : { kitchenGrams: 0, barGrams: 0 });
  const checks = checklistSegments(floor);

  const salesLegend = useLegend(salesMix, (v) => v.toLocaleString(locale));
  const stockLegend = useLegend(stock);
  const prepLegend = useLegend(prep);
  const wasteLegend = useLegend(wasteMix, (v) => `${v.toLocaleString(locale)} g`);

  const checkTotal = segmentTotal(checks);
  const checksDone = checks[0]?.value ?? 0;
  const ringChecks = ringPct(checkTotal > 0 ? (checksDone / checkTotal) * 100 : undefined);
  const stockOk = stock[0]?.value ?? 0;
  const ringStock = ringPct(stockLive ? (stockOk / Math.max(segmentTotal(stock), 1)) * 100 : undefined);
  const ringData = ringPct(completeness?.pct ?? cafe?.completenessPct);

  return (
    <div className="space-y-3" data-testid="dashboard-cafe">
      <div className="grid gap-3 md:grid-cols-2">
        <HealthRings
          title={t.dashChartHealth}
          rings={[
            { id: "completeness", label: t.completenessTitle, tone: "emerald", ...ringData },
            { id: "checks", label: t.dashChartChecks, tone: "indigo", ...ringChecks },
            { id: "stock", label: t.dashChartStock, tone: "amber", ...ringStock },
          ]}
        />
        <DonutCard
          title={t.dashChartSales}
          subtitle="IQD"
          icon={Wallet}
          slices={salesMix}
          legend={salesLegend}
          centerValue={salesLive && sales ? formatCompact(sales.net, locale) : "—"}
          centerLabel="IQD"
          emptyText={t.cafeNoSalesYet}
          hasData={salesLive && hasChartData(salesMix)}
          testId="chart-sales"
        />
        <DonutCard
          title={t.dashChartStock}
          icon={Package}
          slices={stock}
          legend={stockLegend}
          centerValue={stockLive ? segmentTotal(stock) : "—"}
          centerLabel={t.stockItems}
          emptyText={t.stockNotWiredLive}
          hasData={stockLive && hasChartData(stock)}
          testId="chart-stock"
        />
        <DonutCard
          title={t.dashChartPrep}
          icon={ChefHat}
          slices={prep}
          legend={prepLegend}
          centerValue={segmentTotal(prep)}
          centerLabel={t.dashTotal}
          emptyText={t.dashNoChartData}
          hasData={hasChartData(prep)}
          testId="chart-prep"
        />
        <DonutCard
          title={t.dashChartWaste}
          icon={Trash2}
          slices={wasteMix}
          legend={wasteLegend}
          centerValue={wasteLive ? formatCompact(segmentTotal(wasteMix), locale) : "—"}
          centerLabel="g"
          emptyText={t.dashNoChartData}
          hasData={wasteLive && hasChartData(wasteMix)}
          testId="chart-waste"
        />
        <TasksDonut pulse={dash?.pulse} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ChartCard title={t.dashTableSales} icon={Receipt} subtitle={sales?.businessDate} testId="table-sales">
          {salesLive && sales ? (
            <DataTable
              caption={t.dashTableSales}
              rows={[
                { id: "gross", label: t.posGross, value: formatIQD(sales.gross, locale) },
                { id: "discount", label: t.posDiscount, value: formatIQD(sales.discount, locale) },
                { id: "returns", label: t.posReturns, value: formatIQD(sales.returns, locale) },
                { id: "net", label: t.dashRowNet, value: formatIQD(sales.net, locale) },
                { id: "basket", label: t.posBasket, value: formatIQD(sales.basket, locale) },
                { id: "tickets", label: t.dashRowTickets, value: String(sales.ticketCount) },
              ]}
              rowKey={(row) => row.id}
              emptyText={t.cafeNoSalesYet}
              columns={[
                { key: "metric", header: t.dashColMetric, render: (row) => <span className={row.id === "net" ? "font-semibold text-zinc-950" : undefined}>{row.label}</span> },
                { key: "value", header: t.dashColValue, align: "end", render: (row) => <span className={row.id === "net" ? "font-semibold text-zinc-950" : undefined}>{row.value}</span> },
              ]}
            />
          ) : (
            <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">{t.cafeNoSalesYet}</p>
          )}
        </ChartCard>
        <ChannelsTable entry={completeness} />
      </div>

      <CafeManageSections workspaceId={workspaceId} cafe={cafe} seeMoney={seeMoney} canClose={canClose} canRecordPOS={canRecordPOS} />
    </div>
  );
}
